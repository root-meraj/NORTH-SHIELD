"use client";

import { useMemo } from "react";

/**
 * SIGNATURE ELEMENT.
 * A survey-sheet contour field. Rings are generated from a deterministic
 * pseudo-terrain function so the "map" is stable between renders but never
 * looks like a stock gradient. Hazard points emit expanding isobars.
 *
 * This is the one place the page is allowed to be beautiful for its own sake.
 */

type Hazard = { x: number; y: number; hot?: boolean };

const DEFAULT_HAZARDS: Hazard[] = [
  { x: 0.28, y: 0.42, hot: true },
  { x: 0.61, y: 0.29 },
  { x: 0.79, y: 0.66, hot: true },
  { x: 0.44, y: 0.74 },
];

export default function ContourField({
  hazards = DEFAULT_HAZARDS,
  className = "",
}: {
  hazards?: Hazard[];
  className?: string;
}) {
  const W = 1200;
  const H = 700;

  // Ridge lines: layered sine paths at varying amplitude = readable topography.
  const ridges = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const baseY = 90 + t * (H - 140);
      const amp = 46 * (1 - t * 0.55) + 12;
      const freq = 1.6 + t * 1.4;
      const phase = t * 5.1;
      let d = `M -40 ${baseY}`;
      for (let x = 0; x <= W + 40; x += 18) {
        const u = x / W;
        const y =
          baseY +
          Math.sin(u * Math.PI * freq + phase) * amp +
          Math.sin(u * Math.PI * freq * 2.7 + phase * 1.7) * amp * 0.32;
        d += ` L ${x} ${y.toFixed(1)}`;
      }
      lines.push(d);
    }
    return lines;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <linearGradient id="ns-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.05" />
          <stop offset="42%"  stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0.12" />
        </linearGradient>
        <mask id="ns-mask">
          <rect width={W} height={H} fill="url(#ns-fade)" />
        </mask>
        <radialGradient id="ns-hot">
          <stop offset="0%"   stopColor="rgb(255 107 53)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(255 107 53)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g mask="url(#ns-mask)">
        {/* Contours. Only the ridges drift — the graticule and the hazard
            callouts are pinned to real positions, so moving them would lie. */}
        <g className="a-drift">
          {ridges.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i % 5 === 0 ? "rgb(91 192 190)" : "rgb(47 79 71)"}
              strokeOpacity={i % 5 === 0 ? 0.28 : 0.5}
              strokeWidth={i % 5 === 0 ? 1.1 : 0.7}
            />
          ))}
        </g>

        {/* Grid ticks — survey sheet, not decoration: they mark 100 km graticules */}
        {Array.from({ length: 13 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 100} y1={0} x2={i * 100} y2={H}
            stroke="rgb(47 79 71)" strokeOpacity="0.22" strokeWidth="0.5"
            strokeDasharray="2 10"
          />
        ))}

        {/* Hazard isobars */}
        {hazards.map((h, i) => {
          const cx = h.x * W;
          const cy = h.y * H;
          const color = h.hot ? "rgb(255 107 53)" : "rgb(91 192 190)";
          return (
            <g key={`h${i}`}>
              {h.hot && <circle cx={cx} cy={cy} r={130} fill="url(#ns-hot)" className="a-sweep" />}
              {[0, 1, 2].map((k) => (
                <circle
                  key={k}
                  cx={cx} cy={cy} r={16}
                  fill="none" stroke={color} strokeWidth="1.2"
                  className="a-ping"
                  style={{ animationDelay: `${k * 0.8 + i * 0.35}s`, transformOrigin: `${cx}px ${cy}px` }}
                />
              ))}
              <circle cx={cx} cy={cy} r={3.5} fill={color} />
              {/* Survey callout leader line */}
              <path
                d={`M ${cx} ${cy} l 26 -22 l 40 0`}
                fill="none" stroke={color} strokeOpacity="0.55" strokeWidth="0.8"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
