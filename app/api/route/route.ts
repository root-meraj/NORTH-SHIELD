/**
 * POST /api/route  { from: string, to: string }  ->  RouteResult
 * ------------------------------------------------------------------
 * Real road routing via OpenRouteService. The ORS key stays here on the
 * server — it is never shipped to the browser. `from` / `to` are place
 * names from lib/data PLACES.
 *
 * Falls through with a 502 if ORS is unreachable or the key is missing;
 * lib/api.ts then drops back to its mock so the map still works offline.
 */

import { PLACES, SEED_INCIDENTS } from "@/lib/data";
import type { ElevationSample, GeoPoint, Incident, RoutePlan, RouteResult } from "@/lib/types";

const ORS_KEY = process.env.ORS_API_KEY ?? "";
const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Evenly pick ~n points so the polyline and elevation strip stay light. */
function downsample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

/** Risk 0–100 at each point: proximity to known hazards + local steepness. */
function riskProfile(pts: Array<GeoPoint & { ele: number }>, totalKm: number): ElevationSample[] {
  const active = SEED_INCIDENTS.filter((i) => i.severity !== "clear");
  return pts.map((p, i) => {
    const hazard = active.reduce((m, inc) => {
      const d = haversineKm(p, inc.point);
      return Math.max(m, Math.exp(-((d / 3.2) ** 2))); // ~0 beyond ~8 km
    }, 0);
    const prev = pts[Math.max(0, i - 1)];
    const segKm = haversineKm(prev, p) || 0.001;
    const grade = Math.min(1, Math.abs(p.ele - prev.ele) / (segKm * 1000) / 0.12); // 12% grade = 1
    const risk = Math.round(Math.min(100, 12 + hazard * 78 + grade * 24));
    return { km: +((i / (pts.length - 1)) * totalKm).toFixed(1), metres: Math.max(1, Math.round(p.ele)), risk };
  });
}

function hazardsNear(path: GeoPoint[]): Incident[] {
  return SEED_INCIDENTS.filter(
    (inc) => inc.severity !== "clear" && path.some((p) => haversineKm(p, inc.point) < 5),
  );
}

function toPlan(
  feature: { geometry: { coordinates: number[][] }; properties: { summary: { distance: number; duration: number } } },
  id: string,
  label: string,
): RoutePlan {
  const coords = downsample(feature.geometry.coordinates, 96);
  const pts = coords.map((c) => ({ lng: c[0], lat: c[1], ele: c[2] ?? 0 }));
  const path: GeoPoint[] = pts.map((p) => ({ lat: p.lat, lng: p.lng }));
  const distanceKm = Math.round(feature.properties.summary.distance / 1000);
  const durationMin = Math.round(feature.properties.summary.duration / 60);
  const elevation = riskProfile(pts, distanceKm);
  const hazards = hazardsNear(path);
  const peakRisk = elevation.reduce((m, s) => Math.max(m, s.risk), 0);
  return { id, label, distanceKm, durationMin, path, elevation, hazards, peakRisk };
}

export async function POST(request: Request) {
  if (!ORS_KEY) {
    return Response.json({ error: "ORS_API_KEY not set on the server" }, { status: 502 });
  }

  let from: string, to: string;
  try {
    ({ from, to } = await request.json());
  } catch {
    return Response.json({ error: "Body must be JSON { from, to }" }, { status: 400 });
  }

  const a = PLACES[from];
  const b = PLACES[to];
  if (!a || !b) {
    return Response.json({ error: `Unknown place: ${!a ? from : to}` }, { status: 400 });
  }

  const coordinates = [
    [a.lng, a.lat],
    [b.lng, b.lat],
  ];
  // ORS only allows the alternative-routes algorithm under ~100 km. Beyond that,
  // ask for a single route — still real geometry, distance, and elevation.
  const tryAlternatives = haversineKm(a, b) < 70;

  async function callOrs(withAlternatives: boolean) {
    return fetch(ORS_URL, {
      method: "POST",
      headers: { Authorization: ORS_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates,
        elevation: true,
        instructions: false,
        ...(withAlternatives
          ? { alternative_routes: { target_count: 2, weight_factor: 1.7, share_factor: 0.5 } }
          : {}),
      }),
    });
  }

  let ors: Response;
  try {
    ors = await callOrs(tryAlternatives);
    if (!ors.ok && tryAlternatives) ors = await callOrs(false); // retry single-route
  } catch {
    return Response.json({ error: "Could not reach OpenRouteService" }, { status: 502 });
  }

  if (!ors.ok) {
    const detail = await ors.text();
    return Response.json({ error: `ORS ${ors.status}: ${detail.slice(0, 300)}` }, { status: 502 });
  }

  const geo = (await ors.json()) as {
    features: Array<{
      geometry: { coordinates: number[][] };
      properties: { summary: { distance: number; duration: number } };
    }>;
  };
  if (!geo.features?.length) {
    return Response.json({ error: "No route found between those places" }, { status: 502 });
  }

  // Shortest by distance = "direct"; lowest peak risk among the rest = "recommended".
  const plans = geo.features.map((f, i) => toPlan(f, `R-${i}`, "route"));
  const direct = [...plans].sort((x, y) => x.distanceKm - y.distanceKm)[0];
  const recommended =
    plans.length > 1
      ? [...plans].filter((p) => p.id !== direct.id).sort((x, y) => x.peakRisk - y.peakRisk)[0]
      : direct;

  const result: RouteResult = {
    direct: { ...direct, id: "R-direct", label: "Shortest" },
    recommended: { ...recommended, id: "R-safe", label: "Recommended" },
  };
  return Response.json(result);
}
