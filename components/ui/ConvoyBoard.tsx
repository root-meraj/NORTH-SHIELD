"use client";

import { Truck } from "lucide-react";
import { Panel, PanelHead } from "./Panel";
import { SEED_CONVOYS } from "@/lib/data";
import { SEV, cn, hhmm } from "@/lib/utils";

/** Essential-commodity movement. GPS feed plugs into lib/api.ts later. */
export default function ConvoyBoard() {
  return (
    <Panel className="overflow-hidden">
      <PanelHead
        eyebrow="Essential commodities"
        title="Convoys in transit"
        aside={<Truck className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.5} />}
      />
      <ul className="divide-y divide-hairline/30">
        {SEED_CONVOYS.map((v) => {
          const sev = SEV[v.status];
          return (
            <li key={v.id} className="px-5 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="readout text-xs text-bone">{v.id}</span>
                <span className={cn("readout text-xs", sev.text)}>{hhmm(v.etaMin)}</span>
              </div>
              <p className="mt-1 text-sm text-ash">
                {v.cargo}
                <span className="text-faint"> · {v.from} → {v.to}</span>
              </p>
              <div className="mt-2 h-0.5 w-full bg-hairline/40">
                <div
                  className={cn("h-full transition-[width] duration-1000", sev.text.replace("text-", "bg-"))}
                  style={{ width: `${v.progress * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
