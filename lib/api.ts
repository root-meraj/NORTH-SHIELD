/**
 * ============================================================
 *  SINGLE INTEGRATION POINT FOR THE TRAINED MODEL
 * ------------------------------------------------------------
 *  Every function here returns realistic mock data today and is
 *  shaped exactly like the real endpoint it will call tomorrow.
 *  To go live: set NEXT_PUBLIC_API_URL and flip USE_MOCK to false.
 *  Do not call fetch() anywhere else in the app.
 * ============================================================
 */

import { PLACES, SEED_CORRIDORS, SEED_INCIDENTS } from "./data";
import type {
  ClassificationResult, GeoPoint, Incident, IncidentKind,
  RoutePlan, RouteResult, ScenarioInput, ScenarioResult, SosDispatch,
} from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const USE_MOCK = !API;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown, mock: () => T | Promise<T>, delay = 700): Promise<T> {
  if (USE_MOCK) {
    await wait(delay);
    return mock();
  }
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------- */
/* Incidents feed                                             */
/* ---------------------------------------------------------- */

/** GET /api/incidents?since=<iso> */
export async function fetchIncidents(): Promise<Incident[]> {
  if (USE_MOCK) {
    await wait(400);
    return SEED_INCIDENTS;
  }
  const res = await fetch(`${API}/api/incidents`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load incidents");
  return res.json();
}

/* ---------------------------------------------------------- */
/* Route planning — the core value                            */
/* ---------------------------------------------------------- */

/** Great-circle distance, km. */
function haversine(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Interpolate n intermediate points, nudged perpendicular by `bow` to fake a real road. */
function arc(a: GeoPoint, b: GeoPoint, n: number, bow: number): GeoPoint[] {
  const out: GeoPoint[] = [];
  const nx = -(b.lat - a.lat);
  const ny = b.lng - a.lng;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const k = Math.sin(t * Math.PI) * bow;
    out.push({
      lat: a.lat + (b.lat - a.lat) * t + ny * k,
      lng: a.lng + (b.lng - a.lng) * t + nx * k,
    });
  }
  return out;
}

/** Deterministic pseudo-terrain so the elevation strip is stable across renders. */
function elevationFor(path: GeoPoint[], totalKm: number, hazardAt: number[]) {
  return path.map((p, i) => {
    const t = i / (path.length - 1);
    const base =
      420 +
      900 * Math.sin(t * Math.PI * 1.7 + p.lat) +
      380 * Math.sin(t * Math.PI * 4.3 + p.lng * 0.5);
    const near = hazardAt.reduce(
      (m, h) => Math.max(m, Math.exp(-((t - h) ** 2) / 0.004)),
      0,
    );
    return {
      km: +(t * totalKm).toFixed(1),
      metres: Math.max(60, Math.round(base)),
      risk: Math.round(Math.min(100, 12 + near * 82 + Math.abs(Math.sin(t * 9)) * 10)),
    };
  });
}

/** POST /api/route { from, to } -> { direct, recommended } */
export async function planRoute(fromName: string, toName: string): Promise<RouteResult> {
  return post<RouteResult>(
    "/api/route",
    { from: fromName, to: toName },
    () => {
      const a = PLACES[fromName];
      const b = PLACES[toName];
      if (!a || !b) throw new Error(`Unknown place. Pick from the list.`);

      const straightKm = haversine(a, b);
      const directKm = Math.round(straightKm * 1.34);
      const safeKm = Math.round(straightKm * 1.58);

      // Which seeded incidents sit near the direct line?
      const hazards = SEED_INCIDENTS.filter((inc) => {
        const d = Math.min(haversine(inc.point, a), haversine(inc.point, b));
        return d < straightKm * 0.85 && inc.severity !== "clear";
      }).slice(0, 2);

      const directPath = arc(a, b, 64, 0.06);
      const safePath = arc(a, b, 64, -0.19);

      const direct: RoutePlan = {
        id: "R-direct",
        label: "Shortest",
        distanceKm: directKm,
        durationMin: Math.round(directKm * 1.55),
        path: directPath,
        elevation: elevationFor(directPath, directKm, [0.38, 0.71]),
        hazards,
        peakRisk: hazards.length ? 87 : 24,
      };

      const recommended: RoutePlan = {
        id: "R-safe",
        label: "Recommended",
        distanceKm: safeKm,
        durationMin: Math.round(safeKm * 1.48),
        path: safePath,
        elevation: elevationFor(safePath, safeKm, [0.55]),
        hazards: [],
        peakRisk: 19,
      };

      return { direct, recommended };
    },
    900,
  );
}

/* ---------------------------------------------------------- */
/* Image classification — friend's trained CNN goes here       */
/* ---------------------------------------------------------- */

/** POST /api/classify (multipart: image, lat, lng) */
export async function classifyIncident(file: File, at: GeoPoint | null): Promise<ClassificationResult> {
  if (!USE_MOCK) {
    const fd = new FormData();
    fd.append("image", file);
    if (at) {
      fd.append("lat", String(at.lat));
      fd.append("lng", String(at.lng));
    }
    const res = await fetch(`${API}/api/classify`, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Classification failed. Try again or set the type manually.");
    return res.json();
  }

  await wait(1600);
  // Deterministic pick from filename so demos are repeatable.
  const seed = file.name.toLowerCase();
  const kind: IncidentKind = seed.includes("flood")
    ? "flood"
    : seed.includes("road") || seed.includes("crack")
      ? "road_damage"
      : seed.includes("tree")
        ? "tree_fall"
        : "landslide";

  const base: Array<[IncidentKind, number]> = [
    ["landslide", 0.06], ["flood", 0.05], ["road_damage", 0.05],
    ["bridge_out", 0.03], ["tree_fall", 0.03], ["congestion", 0.02],
  ];
  const dist = base.map(([k, p]) => ({ kind: k, p: k === kind ? 0.914 : p }));
  const sum = dist.reduce((s, d) => s + d.p, 0);

  /** Kinds that degrade a corridor rather than close it. */
  const CAUTION_KINDS: IncidentKind[] = ["congestion", "tree_fall"];

  return {
    kind,
    confidence: 0.914,
    severity: CAUTION_KINDS.includes(kind) ? "caution" : "blocked",
    distribution: dist.map((d) => ({ ...d, p: d.p / sum })).sort((x, y) => y.p - x.p),
  };
}

/** POST /api/incidents — file the confirmed report. */
export async function submitReport(payload: {
  kind: IncidentKind;
  severity: string;
  point: GeoPoint | null;
  landmark: string;
  note: string;
}): Promise<{ id: string }> {
  return post("/api/incidents", payload, () => ({
    id: `INC-${Math.floor(4413 + Math.random() * 80)}`,
  }), 800);
}

/* ---------------------------------------------------------- */
/* Scenario model                                              */
/* ---------------------------------------------------------- */

const SEISMIC_W = { none: 0, minor: 8, moderate: 21, major: 38 } as const;
const SEASON_W = { pre_monsoon: 6, monsoon: 24, post_monsoon: 12, winter: 0 } as const;

/** POST /api/predict — weighted model stand-in; responds live to slider changes. */
export function runScenario(input: ScenarioInput): ScenarioResult {
  const rain = (input.rainfall24hMm / 500) * 42;
  const soil = (input.soilSaturationPct / 100) * 24;
  const quake = SEISMIC_W[input.seismic];
  const season = SEASON_W[input.season];
  const horizon = { 6: 0.72, 12: 0.86, 24: 1, 48: 1.12 }[input.horizonHours];

  const overall = Math.round(Math.min(99, (rain + soil + quake + season) * horizon));

  const slide = Math.min(0.98, (soil * 0.028 + rain * 0.016 + quake * 0.022) * horizon);
  const flood = Math.min(0.98, (rain * 0.021 + soil * 0.012) * horizon);
  const block = Math.min(0.98, (slide * 0.55 + flood * 0.4 + quake * 0.008) * 1.1);

  const advisory =
    overall >= 75
      ? `Pre-position relief stock at ${input.district}. Suspend non-essential movement on high-risk corridors for the next ${input.horizonHours} hours.`
      : overall >= 45
        ? `Advise daylight-only movement through ${input.district}. Keep one clearance crew on standby.`
        : `No action required for ${input.district}. Continue routine monitoring.`;

  return {
    overallRisk: overall,
    byKind: [
      { kind: "landslide", p: slide },
      { kind: "flood", p: flood },
      { kind: "road_damage", p: block },
    ],
    corridors: SEED_CORRIDORS.map((c) => ({
      ...c,
      risk: Math.round(Math.min(99, c.risk * 0.5 + overall * 0.6)),
    })).sort((a, b) => b.risk - a.risk),
    advisory,
  };
}

/* ---------------------------------------------------------- */
/* SOS                                                         */
/* ---------------------------------------------------------- */

/** POST /api/sos — cellular first, satellite fallback. */
export async function sendSos(at: GeoPoint | null, online: boolean): Promise<SosDispatch> {
  return post<SosDispatch>(
    "/api/sos",
    { at, online },
    () => ({
      id: `SOS-${Date.now().toString().slice(-6)}`,
      sentAt: new Date().toISOString(),
      point: at ?? { lat: 25.5788, lng: 91.8933 },
      channel: online ? "cellular" : "satellite",
      units: [
        { name: "NDRF 1st Bn, Guwahati", kind: "Rescue team",  etaMin: 34, distanceKm: 22.4 },
        { name: "Sohra PHC Ambulance",   kind: "Medical",      etaMin: 12, distanceKm: 6.1  },
        { name: "State Disaster Cell",   kind: "Coordination", etaMin: 0,  distanceKm: 0    },
      ],
    }),
    1200,
  );
}
