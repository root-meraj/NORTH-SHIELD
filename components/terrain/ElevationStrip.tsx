"use client";

import { useMemo } from "react";
import type { ElevationSample } from "@/lib/types";

/**
 * SIGNATURE ELEMENT #2.
 * Nobody else in the hackathon will show a route as a terrain cross-section.
 * This is what makes the product feel like it understands the North East:
 * the danger is not on a flat map, it is on a slope at a given altitude.
 *
 * Red columns are the km markers where predicted risk crosses the threshold.
 */
export default function ElevationStrip({
  samples,
  height = 96,
  label,
}: {
  samples: ElevationSample[];
  height?: number;
  label?: string;
}) {
  const W = 1000;
  const H = height;

  const { area, line, hazardBands, maxM, totalKm } = useMemo(() => {
    if (!samples.length) {
      return { area: "", line: "", hazardBands: [] as Array<[number, number]>, maxM: 0, totalKm: 0 };
    }
    const maxM = Math.max(...samples.map((s) => s.metres)) * 1.12;
    const totalKm = samples[samples.length - 1].km || 1;
    const x = (s: ElevationSample) => (s.km / totalKm) * W;
    const y = (s: ElevationSample) => H - (s.metres / maxM) * (H - 14) - 6;

    const line = samples.map((s, i) => `${i ? "L" : "M"} ${x(s).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;

    // Contiguous runs where risk >= 55
    const bands: Array<[number, number]> = [];
    let start: number | null = null;
    samples.forEach((s, i) => {
      if (s.risk >= 55 && start === null) start = x(s);
      if ((s.risk < 55 || i === samples.length - 1) && start !== null) {
        bands.push([start, x(s)]);
        start = null;
      }
    });

    return { area, line, hazardBands: bands, maxM, totalKm };
  }, [samples, H]);

  if (!samples.length) return null;

  return (
    <figure className="w-full">
      {label && (
        <figcaption className="mb-2 flex items-baseline justify-between">
          <span className="eyebrow">{label}</span>
          <span className="readout text-[10px] text-faint">
            {Math.round(maxM)} m max · {totalKm.toFixed(0)} km
          </span>
        </figcaption>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Elevation profile, ${hazardBands.length} high-risk sections`}
        className="h-24 w-full sm:h-28"
      >
        <defs>
          <linearGradient id="ns-terrain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgb(91 192 190)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="rgb(91 192 190)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Altitude graticules */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f} x1="0" y1={H * f} x2={W} y2={H * f}
            stroke="rgb(47 79 71)" strokeOpacity="0.5" strokeWidth="0.6" strokeDasharray="3 7"
          />
        ))}

        {/* Hazard columns — drawn under the ridge so the terrain stays legible */}
        {hazardBands.map(([x1, x2], i) => (
          <rect
            key={i}
            x={x1} y={0} width={Math.max(4, x2 - x1)} height={H}
            fill="rgb(255 107 53)" fillOpacity="0.14"
            stroke="rgb(255 107 53)" strokeOpacity="0.4" strokeWidth="0.7"
          />
        ))}

        <path d={area} fill="url(#ns-terrain)" />
        <path d={line} fill="none" stroke="rgb(91 192 190)" strokeOpacity="0.85" strokeWidth="1.6" />
      </svg>

      {hazardBands.length > 0 && (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
          {hazardBands.length} exposed section{hazardBands.length > 1 ? "s" : ""} on this profile
        </p>
      )}
    </figure>
  );
}
