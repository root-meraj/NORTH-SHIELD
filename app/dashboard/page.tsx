import type { Metadata } from "next";

import DistrictGrid from "@/components/dashboard/DistrictGrid";
import ConvoyTable from "@/components/dashboard/ConvoyTable";
import Briefing from "@/components/dashboard/Briefing";
import {
  IncidentsByDistrict, IncidentsByType, IncidentsPerDay,
} from "@/components/dashboard/IncidentCharts";
import { SEED_CORRIDORS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard — Northshield",
  description:
    "District accessibility, convoy movement and the next 24 hours across the eight North Eastern states.",
};

/**
 * The officials' view. The landing page answers "what is Northshield";
 * this answers "what do I do in the next 24 hours" — so it opens with
 * accessibility per state and closes with a briefing that names a decision.
 */
export default function DashboardPage() {
  const blocked = SEED_CORRIDORS.filter((c) => c.status === "blocked").length;

  return (
    <div className="mx-auto max-w-shell px-5 pb-16 pt-24 sm:px-8 lg:pt-28">
      <header className="a-rise">
        <span className="eyebrow">Sheet 03 — Officials&rsquo; view</span>
        <h1 className="t-h1 mt-2">District operations</h1>
        <p className="mt-3 max-w-[60ch] text-pretty text-sm leading-relaxed text-ash">
          {SEED_CORRIDORS.length} corridors under watch across eight states.{" "}
          {blocked} impassable now.
        </p>
      </header>

      {/* ---- 1. District accessibility ---- */}
      <section className="mt-10" aria-labelledby="accessibility">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">By state</span>
            <h2 id="accessibility" className="t-h2 mt-1">
              Accessibility
            </h2>
          </div>
        </div>
        <DistrictGrid />
      </section>

      {/* ---- 2. Convoys ---- */}
      <section className="mt-12" aria-labelledby="convoys">
        <div className="mb-4">
          <span className="eyebrow">Essential commodities</span>
          <h2 id="convoys" className="t-h2 mt-1">
            Movement
          </h2>
        </div>
        <ConvoyTable />
      </section>

      {/* ---- 3. Incident history ---- */}
      <section className="mt-12" aria-labelledby="history">
        <div className="mb-4">
          <span className="eyebrow">Reported incidents</span>
          <h2 id="history" className="t-h2 mt-1">
            History
          </h2>
        </div>

        <div className="grid gap-4">
          <IncidentsPerDay />
          <div className="grid gap-4 lg:grid-cols-2">
            <IncidentsByDistrict />
            <IncidentsByType />
          </div>
        </div>
      </section>

      {/* ---- 4. Briefing ---- */}
      <section className="mt-12" aria-labelledby="briefing">
        <div className="mb-4">
          <span className="eyebrow">Ahead</span>
          <h2 id="briefing" className="t-h2 mt-1">
            Next 24 hours
          </h2>
        </div>
        <Briefing />
      </section>
    </div>
  );
}
