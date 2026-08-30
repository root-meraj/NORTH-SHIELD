"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Panel, PanelHead } from "@/components/ui/Panel";
import {
  KIND_LABEL, SEED_DAILY_INCIDENTS, SEED_DISTRICT_INCIDENTS, SEED_KIND_INCIDENTS,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { chart, axisProps, tooltipStyle, CATEGORICAL_CLASSES } from "./chartTheme";

/** Recharts measures the DOM, so it renders after mount. The frame holds the
 *  same height either way so the page does not jump when the chart arrives. */
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ChartFrame({
  eyebrow, title, aside, height, empty, footer, children,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  height: number;
  empty: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  return (
    <Panel className="overflow-hidden">
      <PanelHead eyebrow={eyebrow} title={title} aside={aside} />
      <div className="px-2 py-4 sm:px-3">
        <div style={{ height }}>
          {empty ? (
            <EmptyChart />
          ) : mounted ? (
            children
          ) : (
            <div className="h-full w-full" aria-hidden />
          )}
        </div>
      </div>
      {!empty && footer}
    </Panel>
  );
}

/** No data is a state worth drawing, not a blank rectangle. */
function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <p className="rounded-[10px] border border-hairline/50 px-4 py-3 text-center text-xs text-ash">
        No incidents recorded in this window. Reporting resumes when a district files.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* 1 — Incidents per day, last 30 days                         */
/* ---------------------------------------------------------- */

export function IncidentsPerDay() {
  const data = SEED_DAILY_INCIDENTS;
  const peak = data.reduce((m, d) => (d.count > m.count ? d : m), data[0]);

  return (
    <ChartFrame
      eyebrow="Last 30 days"
      title="Incidents per day"
      aside={
        <span className="readout shrink-0 text-xs text-faint">
          peak {peak.count} · {peak.label}
        </span>
      }
      height={220}
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={chart.grid} strokeOpacity={0.45} vertical={false} />
          <XAxis
            dataKey="label"
            {...axisProps}
            tick={{ ...axisProps.tick, fill: chart.axis }}
            interval={6}
            minTickGap={8}
          />
          <YAxis
            {...axisProps}
            tick={{ ...axisProps.tick, fill: chart.axis }}
            width={42}
            allowDecimals={false}
          />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} incidents`, ""]} />
          <Line
            type="monotone"
            dataKey="count"
            stroke={chart.series}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ---------------------------------------------------------- */
/* 2 — Incidents by district                                   */
/* ---------------------------------------------------------- */

export function IncidentsByDistrict() {
  const data = SEED_DISTRICT_INCIDENTS;

  return (
    <ChartFrame
      eyebrow="Same window"
      title="By district"
      height={data.length * 26 + 24}
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          barCategoryGap={5}
        >
          <CartesianGrid stroke={chart.grid} strokeOpacity={0.45} horizontal={false} />
          <XAxis
            type="number"
            {...axisProps}
            tick={{ ...axisProps.tick, fill: chart.axis }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="district"
            {...axisProps}
            tick={{ ...axisProps.tick, fill: chart.axis }}
            width={104}
          />
          <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} incidents`, ""]} />
          <Bar dataKey="count" fill={chart.series} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ---------------------------------------------------------- */
/* 3 — Incidents by type                                       */
/* ---------------------------------------------------------- */

export function IncidentsByType() {
  const data = SEED_KIND_INCIDENTS.map((d) => ({ ...d, name: KIND_LABEL[d.kind] }));
  const total = data.reduce((s, d) => s + d.count, 0);
  const palette = chart.categorical;

  return (
    <ChartFrame
      eyebrow="Same window"
      title="By type"
      aside={<span className="readout shrink-0 text-xs text-faint">{total} total</span>}
      height={200}
      empty={total === 0}
      footer={<IncidentTypeKey />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={1.5}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={d.kind} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${v} incidents`, n]} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** The donut has no axis to label it, so the key carries the numbers.
 *  Rendered outside the plot so it stays legible at 390px. */
function IncidentTypeKey() {
  const data = SEED_KIND_INCIDENTS;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 px-5 pb-5">
      {data.map((d, i) => (
        <li key={d.kind} className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              CATEGORICAL_CLASSES[i % CATEGORICAL_CLASSES.length],
            )}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-xs text-ash">{KIND_LABEL[d.kind]}</span>
          <span className="readout shrink-0 text-xs text-bone">
            {Math.round((d.count / total) * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
