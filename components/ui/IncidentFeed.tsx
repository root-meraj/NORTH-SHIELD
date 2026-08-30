"use client";

import { useEffect, useState } from "react";
import { Bot, ShieldCheck, User } from "lucide-react";

import { Panel, PanelHead } from "./Panel";
import { useApp } from "@/lib/store";
import { KIND_ACTION, KIND_LABEL } from "@/lib/data";
import { SEV, ago, cn } from "@/lib/utils";
import type { Incident } from "@/lib/types";

const SOURCE_ICON = { model: Bot, citizen: User, official: ShieldCheck } as const;
const SOURCE_LABEL = { model: "Model", citizen: "Citizen", official: "Official" } as const;

export default function IncidentFeed() {
  const incidents = useApp((s) => s.incidents);
  const [open, setOpen] = useState<string | null>(null);

  // Timestamps are relative, so re-render every 30s to keep them honest.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel contour className="overflow-hidden">
      <PanelHead
        eyebrow="Live feed"
        title="Incidents"
        aside={
          <span className="readout shrink-0 text-xs text-faint">
            {incidents.length} open
          </span>
        }
      />

      {incidents.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm text-ash">No open incidents across the eight states.</p>
          <p className="mt-1 text-xs text-faint">Corridors are being scored every hour.</p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline/30">
          {incidents.map((inc, i) => (
            <Row
              key={inc.id}
              inc={inc}
              index={i}
              expanded={open === inc.id}
              onToggle={() => setOpen(open === inc.id ? null : inc.id)}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Row({
  inc, index, expanded, onToggle,
}: { inc: Incident; index: number; expanded: boolean; onToggle: () => void }) {
  const sev = SEV[inc.severity];
  const SIcon = SOURCE_ICON[inc.source];

  return (
    <li className="a-rise" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-slate-2/50"
      >
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.text.replace("text-", "bg-"))} />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-bone">{KIND_LABEL[inc.kind]}</span>
            <span className="truncate text-sm text-ash">{inc.place}</span>
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
            <span>{inc.district}</span>
            <span aria-hidden>·</span>
            <span>{ago(inc.reportedAt)}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <SIcon className="h-3 w-3" strokeWidth={2} />
              {SOURCE_LABEL[inc.source]}
              {inc.source === "model" && ` ${Math.round(inc.confidence * 100)}%`}
            </span>
          </span>
        </span>

        <span className={cn("pill shrink-0", sev.ring, sev.bg, sev.text)}>{sev.label}</span>
      </button>

      {expanded && (
        <div className="a-rise border-t border-hairline/30 bg-ink/50 px-5 py-4 pl-[2.9rem]">
          <p className="text-sm leading-relaxed text-bone">{KIND_ACTION[inc.kind]}</p>
          {inc.note && <p className="mt-2 text-sm leading-relaxed text-ash">{inc.note}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Field label="Reference" value={inc.id} />
            <Field
              label="Expected clear"
              value={inc.clearsInMin === null ? "Unknown" : `${Math.round(inc.clearsInMin / 60)}h`}
            />
            <Field
              label="Position"
              value={`${inc.point.lat.toFixed(3)}, ${inc.point.lng.toFixed(3)}`}
            />
          </dl>
        </div>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="readout mt-1 text-xs text-bone">{value}</dd>
    </div>
  );
}
