import Link from "next/link";
import { Route as RouteIcon } from "lucide-react";

import { Panel, PanelHead } from "@/components/ui/Panel";
import { runScenario } from "@/lib/api";
import { SEV, cn, riskToSeverity } from "@/lib/utils";
import type { ScenarioInput } from "@/lib/types";

/** Monsoon-season defaults. These are the conditions an official is planning
 *  against in late August, not a neutral baseline. */
const DEFAULTS: ScenarioInput = {
  district: "East Khasi Hills",
  rainfall24hMm: 340,
  soilSaturationPct: 88,
  seismic: "minor",
  season: "monsoon",
  horizonHours: 24,
};

export default function Briefing() {
  const out = runScenario(DEFAULTS);
  const atRisk = out.corridors.slice(0, 3);
  const sev = SEV[riskToSeverity(out.overallRisk)];

  return (
    <Panel contour className="overflow-hidden">
      <PanelHead
        eyebrow="Monsoon defaults"
        title="Briefing"
        aside={
          <span className={cn("pill shrink-0", sev.ring, sev.bg, sev.text)}>
            Risk {out.overallRisk}
          </span>
        }
      />

      <div className="grid gap-px bg-hairline/30 lg:grid-cols-[1.1fr_1fr]">
        <div className="bg-slate/40 px-5 py-5">
          <p className="text-pretty text-sm leading-relaxed text-bone">{out.advisory}</p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <Field label="District" value={DEFAULTS.district} />
            <Field label="Rain 24h" value={`${DEFAULTS.rainfall24hMm} mm`} />
            <Field label="Soil sat." value={`${DEFAULTS.soilSaturationPct}%`} />
            <Field label="Seismic" value="Minor" />
          </dl>

          {/* The one signal action on this page: the briefing is only useful
              if it ends in a rerouting decision. */}
          <Link href="/map" className="btn-signal mt-6 w-full sm:w-auto">
            <RouteIcon className="h-4 w-4" />
            Reroute a convoy
          </Link>
        </div>

        <div className="bg-slate/40">
          <p className="eyebrow px-5 pt-5">Most exposed corridors</p>
          <ul className="mt-3 divide-y divide-hairline/30">
            {atRisk.map((c) => {
              const cs = SEV[riskToSeverity(c.risk)];
              return (
                <li key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-bone">{c.name}</p>
                    <span className={cn("readout shrink-0 text-sm", cs.text)}>{c.risk}</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-hairline/40">
                    <div
                      className={cn("h-full rounded-full", cs.text.replace("text-", "bg-"))}
                      style={{ width: `${c.risk}%` }}
                    />
                  </div>
                  <p className="eyebrow mt-1.5">
                    {c.lengthKm} km · {cs.label}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="readout mt-1 truncate text-xs text-bone">{value}</dd>
    </div>
  );
}
