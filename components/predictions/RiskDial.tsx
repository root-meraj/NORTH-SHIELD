"use client";

import { riskToSeverity } from "@/lib/utils";

const HEX = { clear: "#7FB069", caution: "#E9B44C", blocked: "#D62828" } as const;

/** Semicircular gauge. Ticks are every 10 points, so the reading is measurable. */
export default function RiskDial({ value }: { value: number }) {
  const sev = riskToSeverity(value);
  const color = HEX[sev];
  const R = 78;
  const CIRC = Math.PI * R;
  const offset = CIRC * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-44 sm:w-52" role="img" aria-label={`Overall risk ${value} out of 100`}>
        {/* Track */}
        <path
          d={`M ${100 - R} 100 A ${R} ${R} 0 0 1 ${100 + R} 100`}
          fill="none" stroke="rgb(47 79 71)" strokeWidth="9" strokeLinecap="round"
        />
        {/* Value */}
        <path
          d={`M ${100 - R} 100 A ${R} ${R} 0 0 1 ${100 + R} 100`}
          fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .45s cubic-bezier(.22,1,.36,1), stroke .3s" }}
        />
        {/* Ticks every 10 */}
        {Array.from({ length: 11 }).map((_, i) => {
          const a = Math.PI * (1 - i / 10);
          const r1 = R + 8, r2 = R + (i % 5 === 0 ? 14 : 11);
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * r1} y1={100 - Math.sin(a) * r1}
              x2={100 + Math.cos(a) * r2} y2={100 - Math.sin(a) * r2}
              stroke="rgb(92 112 110)" strokeWidth={i % 5 === 0 ? 1.3 : 0.7}
            />
          );
        })}
        <text
          x="100" y="90" textAnchor="middle"
          fill={color} fontSize="40" fontFamily="var(--font-mono)" fontWeight="500"
        >
          {value}
        </text>
      </svg>
      <p className="eyebrow -mt-1">Composite risk</p>
    </div>
  );
}
