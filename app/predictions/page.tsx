"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Brain, CloudRain, Loader2 } from "lucide-react";

import { Panel, PanelHead } from "@/components/ui/Panel";
import RiskDial from "@/components/predictions/RiskDial";
import { DISTRICTS, KIND_LABEL, PLACES } from "@/lib/data";
import { fetchLiveConditions, runScenario } from "@/lib/api";
import { SEV, cn, riskToSeverity } from "@/lib/utils";
import type { ScenarioInput } from "@/lib/types";

export default function PredictionsPage() {
  const [input, setInput] = useState<ScenarioInput>({
    district: "East Khasi Hills",
    rainfall24hMm: 180,
    soilSaturationPct: 62,
    seismic: "minor",
    season: "monsoon",
    horizonHours: 24,
  });

  const set = <K extends keyof ScenarioInput>(k: K, v: ScenarioInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  const [loadingLive, setLoadingLive] = useState(false);
  async function loadLive() {
    const place = Object.values(PLACES).find((p) => p.district === input.district);
    if (!place) return;
    setLoadingLive(true);
    const live = await fetchLiveConditions({ lat: place.lat, lng: place.lng });
    setLoadingLive(false);
    if (!live) {
      toast.error("Could not fetch live conditions. Enter them by hand.");
      return;
    }
    setInput((s) => ({
      ...s,
      rainfall24hMm: Math.min(500, live.rainfall24hMm),
      soilSaturationPct: live.soilSaturationPct,
    }));
    toast.success(`Live: ${live.rainfall24hMm} mm next 24 h · ${live.rainfall7dMm} mm past week`);
  }

  // Pure function of the inputs, so this stays instant as sliders move.
  const out = useMemo(() => runScenario(input), [input]);

  return (
    <div className="mx-auto max-w-shell px-5 pb-16 pt-24 sm:px-8">
      <span className="eyebrow">Sheet 03 — Forecast</span>
      <h1 className="t-h1 mt-2 max-w-[20ch] text-balance">
        Ask the model what happens if it keeps raining.
      </h1>
      <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-ash">
        Set the conditions and the corridor scores update as you move. This is the same
        model that runs hourly on live gauge data — here you drive it by hand.
      </p>

      <div className="mt-9 grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* ---- Inputs ---- */}
        <Panel className="h-fit p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">Conditions</span>
            <button
              onClick={loadLive}
              disabled={loadingLive}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline/60 px-2.5 py-1 text-[11px] text-ash transition-colors hover:border-glacier/60 hover:text-glacier disabled:opacity-50"
            >
              {loadingLive ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudRain className="h-3 w-3" />}
              Use live weather
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-6">
            <div>
              <label htmlFor="district" className="eyebrow">District</label>
              <select
                id="district"
                value={input.district}
                onChange={(e) => set("district", e.target.value)}
                className="mt-1.5 w-full appearance-none rounded-lg border border-hairline/60 bg-slate-2/70 px-3.5 py-2.5 text-sm text-bone focus:border-signal"
              >
                {DISTRICTS.map((d) => <option key={d} value={d} className="bg-slate">{d}</option>)}
              </select>
            </div>

            <Slider
              id="rain" label="Rainfall, next 24 h" unit=" mm" min={0} max={500} step={10}
              value={input.rainfall24hMm} onChange={(v) => set("rainfall24hMm", v)}
            />
            <Slider
              id="soil" label="Slope saturation" unit=" %" min={0} max={100} step={1}
              value={input.soilSaturationPct} onChange={(v) => set("soilSaturationPct", v)}
            />

            <Choice
              label="Seismic activity"
              value={input.seismic}
              onChange={(v) => set("seismic", v as ScenarioInput["seismic"])}
              options={[["none","None"],["minor","Minor"],["moderate","Moderate"],["major","Major"]]}
            />
            <Choice
              label="Season"
              value={input.season}
              onChange={(v) => set("season", v as ScenarioInput["season"])}
              options={[["pre_monsoon","Pre"],["monsoon","Monsoon"],["post_monsoon","Post"],["winter","Winter"]]}
            />
            <Choice
              label="Horizon"
              value={String(input.horizonHours)}
              onChange={(v) => set("horizonHours", Number(v) as ScenarioInput["horizonHours"])}
              options={[["6","6 h"],["12","12 h"],["24","24 h"],["48","48 h"]]}
            />
          </div>
        </Panel>

        {/* ---- Output ---- */}
        <div className="flex flex-col gap-5">
          <Panel contour className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
            <RiskDial value={out.overallRisk} />

            <div className="flex flex-col justify-center gap-3">
              {out.byKind.map((k) => (
                <div key={k.kind} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
                  <span className="truncate text-xs text-ash">{KIND_LABEL[k.kind]}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-hairline/40">
                    <span
                      className="block h-full rounded-full bg-glacier transition-[width] duration-300"
                      style={{ width: `${k.p * 100}%` }}
                    />
                  </span>
                  <span className="readout text-right text-xs text-bone">
                    {(k.p * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex items-start gap-3.5 border-glacier/25 bg-glacier/6 p-5 sm:p-6">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-glacier" strokeWidth={1.6} />
            <div>
              <span className="eyebrow text-glacier">Recommended action</span>
              <p className="mt-1.5 text-sm leading-relaxed text-bone">{out.advisory}</p>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead
              eyebrow="Under these conditions"
              title="Corridor exposure"
              aside={
                <span className="readout shrink-0 text-xs text-faint">
                  top 5 of {out.corridors.length}
                </span>
              }
            />
            <ul className="divide-y divide-hairline/30">
              {out.corridors.slice(0, 5).map((c) => {
                const sev = SEV[riskToSeverity(c.risk)];
                return (
                  <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="min-w-0 flex-1 truncate text-sm text-bone">{c.name}</span>
                    <span className="hidden h-1 w-28 overflow-hidden rounded-full bg-hairline/40 sm:block">
                      <span
                        className={cn("block h-full rounded-full transition-[width] duration-300", sev.text.replace("text-","bg-"))}
                        style={{ width: `${c.risk}%` }}
                      />
                    </span>
                    <span className={cn("readout w-8 text-right text-sm", sev.text)}>{c.risk}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Slider({
  id, label, unit, min, max, step, value, onChange,
}: {
  id: string; label: string; unit: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">{label}</label>
        <span className="readout text-xs text-bone">{value}{unit}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-hairline
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-signal [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgb(255_107_53_/_0.18)]
                   [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-signal"
      />
    </div>
  );
}

function Choice({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <fieldset>
      <legend className="eyebrow">{label}</legend>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {options.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={cn(
              "rounded-lg border py-2 text-xs transition-colors",
              value === v
                ? "border-signal/60 bg-signal/12 text-signal"
                : "border-hairline/50 bg-slate-2/40 text-ash hover:border-hairline hover:text-bone",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
