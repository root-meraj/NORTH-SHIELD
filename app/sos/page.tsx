"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Phone, Satellite, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/ui/Panel";
import { reverseGeocode, sendSos } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GeoPoint, SosDispatch } from "@/lib/types";

const HOLD_MS = 2000;

const HELPLINES = [
  { name: "Emergency", number: "112", note: "Police, fire, ambulance" },
  { name: "Ambulance", number: "108", note: "Free, all NE states" },
  { name: "NDRF control", number: "011-24363260", note: "Disaster response" },
  { name: "Disaster helpline", number: "1078", note: "State control room" },
];

export default function SosPage() {
  const { userPoint, setUserPoint, online } = useApp();
  const [progress, setProgress] = useState(0);
  const [dispatch, setDispatch] = useState<SosDispatch | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [locating, setLocating] = useState(false);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pt = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserPoint(pt);
        try {
          localStorage.setItem("northshield_gps", JSON.stringify(pt));
        } catch {}
        setLocating(false);
        void reverseGeocode(pt).then((label) => {
          if (label) setPlaceLabel(label);
        });
      },
      (err) => {
        setLocating(false);
        console.warn("Geolocation prompt skipped or denied:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [setUserPoint]);

  // Request position on arrival and read cached GPS if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("northshield_gps");
      if (saved) {
        const pt = JSON.parse(saved);
        if (pt && typeof pt.lat === "number" && typeof pt.lng === "number") {
          setUserPoint(pt);
          void reverseGeocode(pt).then((label) => {
            if (label) setPlaceLabel(label);
          });
        }
      }
    } catch {}
    locate();
  }, [locate, setUserPoint]);

  useEffect(() => {
    if (!dispatch) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  const fire = useCallback(async () => {
    let currentPoint = userPoint;
    if (!currentPoint && navigator.geolocation) {
      try {
        const p = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true })
        );
        currentPoint = { lat: p.coords.latitude, lng: p.coords.longitude };
        setUserPoint(currentPoint);
      } catch {
        // Fallback gracefully to default
      }
    }
    const d = await sendSos(currentPoint, online);
    setDispatch(d);
    setElapsed(0);
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }, [userPoint, online, setUserPoint]);

  const begin = useCallback(() => {
    if (dispatch) return;
    if (!userPoint) locate();
    start.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { void fire(); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [dispatch, userPoint, locate, fire]);

  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  }, []);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div
      className="min-h-dvh px-5 pb-16 pt-24 sm:px-8"
      style={{ background: "radial-gradient(120% 80% at 50% 0%, rgb(214 40 40 / 0.14), transparent 62%)" }}
    >
      <div className="mx-auto max-w-2xl">
        {!dispatch ? (
          <>
            <div className="text-center">
              <span className="eyebrow">Emergency</span>
              <h1 className="t-h1 mt-2 text-balance">Send your position to the nearest team.</h1>
              <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-relaxed text-ash">
                Works without cellular signal. If the tower is down, the request goes out over
                satellite instead.
              </p>
            </div>

            {/* Hold, not tap — an accidental brush should not dispatch NDRF. */}
            <div className="mt-12 flex justify-center">
              <button
                onPointerDown={begin}
                onPointerUp={cancel}
                onPointerLeave={cancel}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); begin(); } }}
                onKeyUp={cancel}
                aria-label="Hold for two seconds to send an SOS"
                className="group relative flex h-56 w-56 select-none items-center justify-center rounded-full transition-transform active:scale-[0.97] sm:h-64 sm:w-64"
                style={{ touchAction: "none" }}
              >
                <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
                  <circle cx="100" cy="100" r="92" fill="rgb(214 40 40 / 0.1)" stroke="rgb(214 40 40 / 0.35)" strokeWidth="2" />
                  <circle
                    cx="100" cy="100" r="92" fill="none"
                    stroke="#D62828" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 92}
                    strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
                  />
                </svg>
                <span className="absolute inset-6 rounded-full bg-blocked/90 shadow-[0_0_70px_-10px_rgb(214_40_40)]" />
                <span className="relative flex flex-col items-center text-bone">
                  <TriangleAlert className="h-9 w-9" strokeWidth={1.8} />
                  <span className="mt-3 font-display text-2xl font-semibold tracking-tight">SOS</span>
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] opacity-85">
                    {progress > 0 ? "Keep holding" : "Hold 2 seconds"}
                  </span>
                </span>
              </button>
              {/* GPS status readout */}
              <div className="mt-6 flex flex-col items-center gap-1.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline/50 bg-slate-2/60 px-4 py-1.5 backdrop-blur-sm">
                  <MapPin className={cn("h-3.5 w-3.5", userPoint ? "text-clear animate-pulse" : locating ? "text-glacier animate-spin" : "text-caution")} />
                  {locating ? (
                    <span className="font-mono text-xs text-ash">Acquiring GPS position…</span>
                  ) : userPoint ? (
                    <span className="font-mono text-xs text-bone">
                      GPS Locked: {userPoint.lat.toFixed(4)}, {userPoint.lng.toFixed(4)}
                      {placeLabel ? ` (${placeLabel})` : ""}
                    </span>
                  ) : (
                    <button onClick={locate} className="font-mono text-xs text-signal underline underline-offset-2">
                      GPS Not Locked — Click to Enable
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <span className="eyebrow">Or call directly</span>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {HELPLINES.map((h) => (
                  <li key={h.number}>
                    <a
                      href={`tel:${h.number}`}
                      className="flex items-center gap-3.5 rounded-xl border border-hairline/50 bg-slate/60 px-4 py-3.5 transition-colors hover:border-hairline hover:bg-slate-2/70"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-ash" strokeWidth={1.6} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-bone">{h.name}</span>
                        <span className="block text-[11px] text-faint">{h.note}</span>
                      </span>
                      <span className="readout shrink-0 text-sm text-bone">{h.number}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="a-rise">
            <Panel className="border-blocked/40 bg-blocked/8 p-6 text-center sm:p-8">
              <p className="readout text-4xl text-blocked sm:text-5xl">{clock}</p>
              <p className="eyebrow mt-2">Since dispatch · {dispatch.id}</p>
              <div className="rule my-6" />
              <p className="text-sm leading-relaxed text-bone">
                Your position went out over{" "}
                <span className={dispatch.channel === "satellite" ? "text-glacier" : "text-clear"}>
                  {dispatch.channel === "satellite" ? "satellite" : "the cellular network"}
                </span>
                . Three units have it. Stay where you are if it is safe to do so.
              </p>
              {dispatch.channel === "satellite" && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-glacier/30 bg-glacier/8 px-3 py-2 text-xs text-glacier">
                  <Satellite className="h-3.5 w-3.5" strokeWidth={1.8} />
                  NavIC uplink · no cellular required
                </p>
              )}
            </Panel>

            <Panel className="mt-4 overflow-hidden">
              <div className="border-b border-hairline/40 px-5 py-4">
                <span className="eyebrow">Responding</span>
              </div>
              <ul className="divide-y divide-hairline/30">
                {dispatch.units.map((u) => (
                  <li key={u.name} className="flex items-center gap-4 px-5 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-bone">{u.name}</span>
                      <span className="block text-[11px] text-faint">{u.kind} · {u.distanceKm} km</span>
                    </span>
                    <span className={cn("readout shrink-0 text-sm", u.etaMin === 0 ? "text-clear" : "text-caution")}>
                      {u.etaMin === 0 ? "Notified" : `${u.etaMin} min`}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <button onClick={() => { setDispatch(null); setProgress(0); }} className="btn-quiet mt-4 w-full">
              I am safe. Stand the units down
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
