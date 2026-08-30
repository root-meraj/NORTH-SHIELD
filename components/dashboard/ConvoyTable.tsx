"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Truck } from "lucide-react";

import { Panel, PanelHead } from "@/components/ui/Panel";
import { SEED_CONVOYS } from "@/lib/data";
import { SEV, cn, hhmm } from "@/lib/utils";
import type { Severity } from "@/lib/types";

type SortKey = "eta" | "status";
type Dir = "asc" | "desc";

/** Worst first when sorting by status — the stuck convoy is the one that
 *  needs a decision, so it should never be buried at the bottom. */
const STATUS_RANK: Record<Severity, number> = { blocked: 0, caution: 1, clear: 2 };

export default function ConvoyTable() {
  const [key, setKey] = useState<SortKey>("eta");
  const [dir, setDir] = useState<Dir>("asc");

  const rows = useMemo(() => {
    const sorted = [...SEED_CONVOYS].sort((a, b) =>
      key === "eta"
        ? a.etaMin - b.etaMin
        : STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.etaMin - b.etaMin,
    );
    return dir === "asc" ? sorted : sorted.reverse();
  }, [key, dir]);

  const toggle = (k: SortKey) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setKey(k); setDir("asc"); }
  };

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        eyebrow="Live positions"
        title="Convoys in transit"
        aside={
          <div className="flex shrink-0 items-center gap-2">
            <SortButton label="ETA" active={key === "eta"} dir={dir} onClick={() => toggle("eta")} />
            <SortButton label="Status" active={key === "status"} dir={dir} onClick={() => toggle("status")} />
            <Truck className="hidden h-4 w-4 text-faint sm:block" strokeWidth={1.5} />
          </div>
        }
      />

      {/* Desktop: a real table. Mobile: stacked cards — a table that scrolls
          sideways on a phone hides the column an operator came to read. */}
      <div className="hidden lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline/40">
              <Th>Vehicle</Th>
              <Th>Cargo</Th>
              <Th>Route</Th>
              <Th className="w-[18%]">Progress</Th>
              <Th className="text-right">ETA</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/30">
            {rows.map((v) => {
              const sev = SEV[v.status];
              return (
                <tr key={v.id} className="transition-colors hover:bg-slate-2/40">
                  <td className="px-5 py-3.5">
                    <span className="readout text-xs text-bone">{v.id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ash">{v.cargo}</td>
                  <td className="px-5 py-3.5 text-sm text-ash">
                    {v.from} <span className="text-faint">→</span> {v.to}
                  </td>
                  <td className="px-5 py-3.5">
                    <ProgressBar value={v.progress} status={v.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={cn("readout text-xs", sev.text)}>{hhmm(v.etaMin)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={cn("pill", sev.ring, sev.bg, sev.text)}>{sev.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-hairline/30 lg:hidden">
        {rows.map((v) => {
          const sev = SEV[v.status];
          return (
            <li key={v.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <span className="readout min-w-0 truncate text-xs text-bone">{v.id}</span>
                <span className={cn("pill shrink-0", sev.ring, sev.bg, sev.text)}>{sev.label}</span>
              </div>

              <p className="mt-1.5 text-sm text-ash">
                {v.cargo}
                <span className="text-faint"> · {v.from} → {v.to}</span>
              </p>

              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={v.progress} status={v.status} className="flex-1" />
                <span className={cn("readout shrink-0 text-xs", sev.text)}>{hhmm(v.etaMin)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("eyebrow px-5 py-3 font-normal", className)}>{children}</th>;
}

function SortButton({
  label, active, dir, onClick,
}: { label: string; active: boolean; dir: Dir; onClick: () => void }) {
  const Icon = dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "border-hairline bg-slate-2 text-bone"
          : "border-hairline/50 text-faint hover:text-ash",
      )}
    >
      {label}
      {active && <Icon className="h-3 w-3" strokeWidth={2} />}
    </button>
  );
}

function ProgressBar({
  value, status, className,
}: { value: number; status: Severity; className?: string }) {
  return (
    <div
      className={cn("h-1 overflow-hidden rounded-full bg-hairline/40", className)}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Journey complete"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700",
          SEV[status].text.replace("text-", "bg-"),
        )}
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}
