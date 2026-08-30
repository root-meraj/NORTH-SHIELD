export type IncidentKind =
  | "landslide"
  | "flood"
  | "road_damage"
  | "bridge_out"
  | "tree_fall"
  | "congestion";

export type Severity = "clear" | "caution" | "blocked";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  kind: IncidentKind;
  severity: Severity;
  point: GeoPoint;
  place: string;
  district: string;
  state: NEState;
  /** ISO string. Render with formatDistanceToNow, never store a formatted string. */
  reportedAt: string;
  source: "model" | "citizen" | "official";
  /** 0–1. Model confidence, or citizen-report verification score. */
  confidence: number;
  note?: string;
  photoUrl?: string;
  /** Minutes until the corridor is expected to reopen. null = unknown. */
  clearsInMin: number | null;
}

export type NEState =
  | "Assam"
  | "Arunachal Pradesh"
  | "Manipur"
  | "Meghalaya"
  | "Mizoram"
  | "Nagaland"
  | "Sikkim"
  | "Tripura";

export interface Corridor {
  id: string;
  name: string;
  from: string;
  to: string;
  /** 0–100 */
  risk: number;
  status: Severity;
  lengthKm: number;
}

export interface ElevationSample {
  km: number;
  metres: number;
  /** Risk at this point along the route, 0–100. Drives the hazard shading. */
  risk: number;
}

export interface RoutePlan {
  id: string;
  label: string;
  distanceKm: number;
  durationMin: number;
  path: GeoPoint[];
  elevation: ElevationSample[];
  hazards: Incident[];
  /** Peak risk anywhere along this route, 0–100. */
  peakRisk: number;
}

export interface RouteResult {
  direct: RoutePlan;
  recommended: RoutePlan;
}

export interface ClassificationResult {
  kind: IncidentKind;
  confidence: number;
  /** Full distribution so the operator can see what the model nearly chose. */
  distribution: Array<{ kind: IncidentKind; p: number }>;
  /** Model's own severity read, which the reporter can override. */
  severity: Severity;
}

export interface ScenarioInput {
  district: string;
  rainfall24hMm: number;
  soilSaturationPct: number;
  seismic: "none" | "minor" | "moderate" | "major";
  season: "pre_monsoon" | "monsoon" | "post_monsoon" | "winter";
  horizonHours: 6 | 12 | 24 | 48;
}

export interface ScenarioResult {
  overallRisk: number;
  byKind: Array<{ kind: IncidentKind; p: number }>;
  corridors: Corridor[];
  advisory: string;
}

export interface SosDispatch {
  id: string;
  sentAt: string;
  point: GeoPoint;
  channel: "cellular" | "satellite";
  units: Array<{ name: string; kind: string; etaMin: number; distanceKm: number }>;
}
