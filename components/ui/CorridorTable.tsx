"use client";

import { Panel, PanelHead } from "./Panel";
import { SEED_CORRIDORS } from "@/lib/data";
import { SEV, cn } from "@/lib/utils";

/** Ranked by risk, because the top row is the one that needs a decision.
 *  Capped at five — the full set lives on /dashboard. */
export default function CorridorTable() {
  const rows = [...SEED_CORRIDORS].sort((a, b) => b.risk - a.risk).slice(0, 5);

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        eyebrow="Ranked by risk"
        title="Corridors"
        aside={
          <span className="readout shrink-0 text-xs text-faint">
            top 5 of {SEED_CORRIDORS.length}
          </span>
        }
      />
      <ul className="divide-y divide-hairline/30">
        {rows.map((c) => {
          const sev = SEV[c.status];
          return (
            <li key={c.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-bone">{c.name}</p>
                <span className={cn("readout shrink-0 text-sm", sev.text)}>{c.risk}</span>
              </div>
              {/* Risk bar doubles as the status indicator — one element, one job */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hairline/40">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-700", sev.text.replace("text-", "bg-"))}
                  style={{ width: `${c.risk}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                {c.lengthKm} km · {sev.label}
              </p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
