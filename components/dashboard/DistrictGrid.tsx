import { Panel } from "@/components/ui/Panel";
import { NE_STATES, SEED_CORRIDORS, corridorStates } from "@/lib/data";
import { SEV, cn } from "@/lib/utils";
import type { NEState, Severity } from "@/lib/types";

/** Corridor counts per state, by status. A corridor spanning two states
 *  counts in both — the road is either open to you or it is not. */
function tally(state: NEState): Record<Severity, number> {
  const counts: Record<Severity, number> = { clear: 0, caution: 0, blocked: 0 };
  for (const c of SEED_CORRIDORS) {
    if (corridorStates(c).includes(state)) counts[c.status] += 1;
  }
  return counts;
}

/** The order an official reads them in: what is shut, then what is failing. */
const COLUMNS: Array<{ key: Severity; label: string }> = [
  { key: "clear", label: "Open" },
  { key: "caution", label: "Degraded" },
  { key: "blocked", label: "Blocked" },
];

export default function DistrictGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {NE_STATES.map((state, i) => {
        const counts = tally(state);
        const worst: Severity =
          counts.blocked > 0 ? "blocked" : counts.caution > 0 ? "caution" : "clear";

        return (
          <Panel
            key={state}
            className="a-rise p-4"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  SEV[worst].text.replace("text-", "bg-"),
                )}
                aria-hidden
              />
              <h3 className="min-w-0 text-sm font-medium leading-snug text-bone">{state}</h3>
            </div>

            {/* Stacked rather than three-up: at 390px a card is ~167px wide
                and three tracked-out labels in a row will not fit. */}
            <dl className="mt-3 space-y-1.5">
              {COLUMNS.map((col) => (
                <div key={col.key} className="flex items-baseline justify-between gap-2">
                  <dt className="eyebrow">{col.label}</dt>
                  <dd
                    className={cn(
                      "readout text-base leading-none",
                      counts[col.key] === 0 ? "text-faint" : SEV[col.key].text,
                    )}
                  >
                    {counts[col.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        );
      })}
    </div>
  );
}
