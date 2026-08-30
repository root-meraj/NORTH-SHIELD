"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ChevronUp, Crosshair, Loader2, TriangleAlert } from "lucide-react";

import ElevationStrip from "@/components/terrain/ElevationStrip";
import { PLACE_NAMES } from "@/lib/data";
import { planRoute } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn, hhmm } from "@/lib/utils";

/** Leaflet touches window on import, so it can never render on the server. */
const LiveMap = dynamic(() => import("@/components/map/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink">
      <div className="text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-glacier" />
        <p className="mt-3 eyebrow">Loading terrain</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { route, setRoute, activeRouteId, setActiveRoute, setUserPoint, pushAlert } = useApp();
  const [from, setFrom] = useState("Guwahati");
  const [to, setTo] = useState("Silchar");
  const [busy, setBusy] = useState(false);
  /** Phones open at a peek — From/To and the action button, nothing else.
   *  Results are what expansion buys you. Desktop ignores this entirely. */
  const [sheet, setSheet] = useState(false);

  // The sheet covers the bottom of the map, so the map has to know how much
  // of itself is hidden before it fits a route into the visible part.
  const sheetRef = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [inset, setInset] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const r = el.getBoundingClientRect();
      setInset(desktop ? { bottom: 0, left: r.width + 24 } : { bottom: r.height, left: 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // A route is the reason to expand, wherever it came from — planning here,
  // or the guided demo preloading one before it navigates in.
  useEffect(() => {
    if (route) setSheet(true);
  }, [route]);

  // Drag the handle to expand or collapse; a tap still toggles.
  const dragFrom = useRef<number | null>(null);
  function onHandleDown(e: React.PointerEvent) {
    dragFrom.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onHandleUp(e: React.PointerEvent) {
    const start = dragFrom.current;
    dragFrom.current = null;
    if (start === null) return;
    const dy = e.clientY - start;
    if (dy < -24) setSheet(true);
    else if (dy > 24) setSheet(false);
    else setSheet((s) => !s);
  }

  async function onPlan() {
    if (from === to) {
      toast.error("Pick two different places.");
      return;
    }
    setBusy(true);
    try {
      const res = await planRoute(from, to);
      setRoute(res);
      setActiveRoute("R-safe");
      // The comparison is the answer to the question they just asked, so
      // bring it into view rather than leaving it below the sheet's fold.
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );

      if (res.direct.hazards.length) {
        const h = res.direct.hazards[0];
        pushAlert({
          level: "danger",
          title: "Shortest route is blocked",
          body: `${h.place} is impassable. Recommended route adds ${
            res.recommended.durationMin - res.direct.durationMin
          } minutes and avoids it.`,
        });
        toast.warning(`Avoiding ${h.place}`, {
          description: `+${res.recommended.durationMin - res.direct.durationMin} min on the recommended route.`,
        });
      } else {
        toast.success("Route is clear end to end.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not plan that route. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      toast.error("This browser will not share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUserPoint({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Position locked.");
      },
      () => toast.error("Location blocked. Allow it in your browser settings to centre the map."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const active = route ? (activeRouteId === "R-safe" ? route.recommended : route.direct) : null;
  const delta = route ? route.recommended.durationMin - route.direct.durationMin : 0;

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full pt-14">
      <div className="absolute inset-0 top-14">
        <LiveMap className="h-full w-full" bottomInset={inset.bottom} leftInset={inset.left} />
      </div>

      {/* Progress reads on the map itself, where the answer will appear —
          a spinner over the map would hide the thing being computed. */}
      {busy && (
        <div
          className="absolute inset-x-0 top-14 z-[600] h-0.5 overflow-hidden"
          role="progressbar"
          aria-label="Scoring corridors"
        >
          <div className="a-progress h-full w-1/3 bg-signal" />
        </div>
      )}

      {/* Locate — floats clear of the panel on every breakpoint */}
      <button
        onClick={locate}
        aria-label="Centre on my position"
        className="absolute right-4 top-20 z-[500] rounded-xl border border-hairline/60 bg-slate/90 p-2.5 text-ash backdrop-blur-md transition-colors hover:text-bone"
      >
        <Crosshair className="h-4 w-4" strokeWidth={1.8} />
      </button>

      {/* Control panel: sidebar on desktop, bottom sheet on phones */}
      <section
        ref={sheetRef}
        className={cn(
          "absolute z-[500] flex flex-col gap-4 overflow-y-auto",
          // Half the screen, no more: an expanded sheet taller than this
          // leaves too little map for the route it is describing.
          "inset-x-0 bottom-0 max-h-[50dvh] rounded-t-2xl border-t border-hairline/60 bg-ink/92 p-5 backdrop-blur-xl",
          "lg:inset-y-auto lg:left-6 lg:top-20 lg:bottom-6 lg:w-[360px] lg:rounded-2xl lg:border",
        )}
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {/* Grab handle, phones only. Drag up to expand, down to collapse. */}
        <button
          onPointerDown={onHandleDown}
          onPointerUp={onHandleUp}
          className="mx-auto -mt-1 mb-1 flex shrink-0 touch-none flex-col items-center gap-1 py-1 lg:hidden"
          aria-expanded={sheet}
          aria-label={sheet ? "Collapse route panel" : "Expand route panel"}
        >
          <span className="h-1 w-10 rounded-full bg-hairline" />
          {route && (
            <ChevronUp
              className={cn(
                "h-3 w-3 text-faint transition-transform duration-300",
                sheet && "rotate-180",
              )}
              strokeWidth={2}
            />
          )}
        </button>

        <div>
          <span className="eyebrow">Route planner</span>
          <h1 className="t-h2 mt-1">Where are you going?</h1>
        </div>

        <div className="grid gap-2.5">
          <Field label="From" value={from} onChange={setFrom} />
          <Field label="To" value={to} onChange={setTo} />
        </div>

        <button onClick={onPlan} disabled={busy} className="btn-signal w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {busy ? "Scoring corridors" : "Find a safe route"}
        </button>

        {!route && !busy && (
          <p className="text-xs leading-relaxed text-ash">
            Two routes come back: the shortest road, and the one that avoids every
            corridor the model expects to fail. Both are drawn on the map so you
            can see what the extra time buys.
          </p>
        )}

        {route && (
          <div
            ref={resultsRef}
            className={cn("a-rise flex-col gap-3", sheet ? "flex" : "hidden lg:flex")}
          >
            <div className="rule" />

            {/* Two options, always shown together. The trade-off is the product. */}
            <div className="grid gap-2">
              <Option
                selected={activeRouteId === "R-safe"}
                onSelect={() => setActiveRoute("R-safe")}
                tone="clear"
                label="Recommended"
                distance={route.recommended.distanceKm}
                duration={route.recommended.durationMin}
                note="No known hazards"
              />
              <Option
                selected={activeRouteId === "R-direct"}
                onSelect={() => setActiveRoute("R-direct")}
                tone={route.direct.hazards.length ? "blocked" : "clear"}
                label="Shortest"
                distance={route.direct.distanceKm}
                duration={route.direct.durationMin}
                note={
                  route.direct.hazards.length
                    ? `${route.direct.hazards.length} hazard${route.direct.hazards.length > 1 ? "s" : ""} on route`
                    : "No known hazards"
                }
              />
            </div>

            {route.direct.hazards.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-signal/30 bg-signal/8 px-3 py-2.5 text-xs leading-relaxed text-signal">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span>
                  The recommended route costs {hhmm(Math.abs(delta))} more and avoids{" "}
                  {route.direct.hazards.map((h) => h.place).join(", ")}.
                </span>
              </p>
            )}

            {active && (
              <ElevationStrip samples={active.elevation} label="Terrain profile" />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = `f-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full appearance-none rounded-lg border border-hairline/60 bg-slate-2/70 px-3 py-2.5 text-sm text-bone transition-colors hover:border-hairline focus:border-signal"
      >
        {PLACE_NAMES.map((p) => (
          <option key={p} value={p} className="bg-slate">{p}</option>
        ))}
      </select>
    </div>
  );
}

function Option({
  selected, onSelect, tone, label, distance, duration, note,
}: {
  selected: boolean; onSelect: () => void; tone: "clear" | "blocked";
  label: string; distance: number; duration: number; note: string;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border px-4 py-3 text-left transition-all",
        selected
          ? tone === "clear"
            ? "border-clear/55 bg-clear/10"
            : "border-blocked/55 bg-blocked/10"
          : "border-hairline/50 bg-slate-2/40 hover:border-hairline",
      )}
    >
      {/* Distance sits under duration rather than beside the note: at 390px
          a long note and the distance were on a collision course. */}
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-bone">{label}</span>
          <span
            className={cn(
              "mt-1 block font-mono text-[10px] uppercase leading-relaxed tracking-[0.13em]",
              tone === "clear" ? "text-clear" : "text-blocked",
            )}
          >
            {note}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="readout block text-sm text-bone">{hhmm(duration)}</span>
          <span className="readout mt-1 block text-[11px] text-faint">{distance} km</span>
        </span>
      </div>
    </button>
  );
}
