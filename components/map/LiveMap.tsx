"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useApp } from "@/lib/store";
import { KIND_LABEL } from "@/lib/data";
import { ago } from "@/lib/utils";
import type { Incident, Severity } from "@/lib/types";

const SEV_HEX: Record<Severity, string> = {
  clear: "#7FB069",
  caution: "#E9B44C",
  blocked: "#D62828",
};

/** Inline SVG marker so there are no image requests and no broken default icon. */
function markerFor(inc: Incident) {
  const c = SEV_HEX[inc.severity];
  return L.divIcon({
    className: "!bg-transparent !border-0",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `
      <span style="position:relative;display:block;width:30px;height:30px">
        <span style="position:absolute;inset:0;border-radius:99px;background:${c};opacity:.22;
                     animation:ns-ping 2.4s cubic-bezier(0,0,.2,1) infinite"></span>
        <span style="position:absolute;inset:9px;border-radius:99px;background:${c};
                     box-shadow:0 0 0 2px #0C1416, 0 0 14px ${c}"></span>
      </span>`,
  });
}

/**
 * Fits the viewport to whatever matters right now, without fighting user pans.
 * The insets are the parts of the map hidden behind the sheet (phones) or the
 * sidebar (desktop) — a route fitted to the full map would be drawn underneath
 * them. Each inset is capped so a tall sheet cannot squeeze the fit to nothing.
 */
function AutoFit({
  bounds, bottomInset, leftInset,
}: { bounds: L.LatLngBoundsExpression | null; bottomInset: number; leftInset: number }) {
  const map = useMap();
  // Identity, not reference: `bounds` is rebuilt on every render.
  const key = bounds ? JSON.stringify(bounds) : null;

  useEffect(() => {
    if (!bounds) return;
    // The sheet expands right after the route lands, so the inset arrives a
    // beat later. Settling first matters: Leaflet drops a fitBounds issued
    // while the previous one is still animating, and the stale fit wins.
    const id = setTimeout(() => {
      const size = map.getSize();
      const bottom = Math.min(bottomInset, size.y * 0.62);
      const left = Math.min(leftInset, size.x * 0.45);
      map.fitBounds(bounds, {
        paddingTopLeft: [left + 28, 48],
        paddingBottomRight: [28, bottom + 24],
        maxZoom: 11,
        animate: true,
      });
    }, 160);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bottomInset, leftInset, map]);
  return null;
}

export default function LiveMap({
  className = "", bottomInset = 0, leftInset = 0,
}: { className?: string; bottomInset?: number; leftInset?: number }) {
  const { incidents, route, activeRouteId, userPoint } = useApp();

  const active = route ? (activeRouteId === "R-safe" ? route.recommended : route.direct) : null;
  // Fit to both options, not just the selected one — the comparison is the
  // product, and a viewport that crops the rejected route hides half of it.
  const bounds: L.LatLngBoundsExpression | null = route
    ? [...route.direct.path, ...route.recommended.path].map(
        (p) => [p.lat, p.lng] as [number, number],
      )
    : null;

  return (
    <MapContainer
      center={[25.9, 92.4]}
      zoom={7}
      zoomControl={false}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      {/* OSM standard tiles, darkened in CSS (see .leaflet-tile in globals).
          CARTO's dark basemap now stamps "API KEY REQUIRED" across every
          anonymous tile, which is not something to discover on stage. */}
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={19}
      />

      <AutoFit bounds={bounds} bottomInset={bottomInset} leftInset={leftInset} />

      {/* Rejected route sits underneath, dimmed — the comparison is the point. */}
      {route && (
        <Polyline
          positions={route.direct.path.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: activeRouteId === "R-direct" ? "#FF6B35" : "#5C706E",
            weight: activeRouteId === "R-direct" ? 4 : 2,
            opacity: activeRouteId === "R-direct" ? 1 : 0.45,
            dashArray: activeRouteId === "R-direct" ? undefined : "6 8",
          }}
        />
      )}

      {route && (
        <Polyline
          positions={route.recommended.path.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: activeRouteId === "R-safe" ? "#7FB069" : "#5C706E",
            weight: activeRouteId === "R-safe" ? 4 : 2,
            opacity: activeRouteId === "R-safe" ? 1 : 0.45,
            dashArray: activeRouteId === "R-safe" ? undefined : "6 8",
          }}
        />
      )}

      {incidents.map((inc) => (
        <Marker key={inc.id} position={[inc.point.lat, inc.point.lng]} icon={markerFor(inc)}>
          <Popup>
            <div className="min-w-[190px] font-sans">
              <p className="text-sm font-semibold text-bone">{KIND_LABEL[inc.kind]}</p>
              <p className="mt-0.5 text-xs text-ash">{inc.place}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                {inc.source === "model" ? `Predicted · ${Math.round(inc.confidence * 100)}%` : "Reported"} · {ago(inc.reportedAt)}
              </p>
              {inc.clearsInMin !== null && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-caution">
                  Clears in ~{Math.round(inc.clearsInMin / 60)}h
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {userPoint && (
        <CircleMarker
          center={[userPoint.lat, userPoint.lng]}
          radius={7}
          pathOptions={{ color: "#5BC0BE", fillColor: "#5BC0BE", fillOpacity: 1, weight: 3 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
