"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Check, ImagePlus, Loader2, MapPin, RotateCcw } from "lucide-react";

import { Panel } from "@/components/ui/Panel";
import { classifyIncident, reverseGeocode, submitReport } from "@/lib/api";
import { KIND_LABEL } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ClassificationResult, GeoPoint, IncidentKind, Severity } from "@/lib/types";

type Step = 1 | 2 | 3;

const SEVERITIES: Array<{ v: Severity; label: string; help: string }> = [
  { v: "clear",   label: "Passable",   help: "Traffic is moving. Worth logging." },
  { v: "caution", label: "Degraded",   help: "Single lane, slow, or risky." },
  { v: "blocked", label: "Impassable", help: "Do not send anyone through." },
];

export default function ReportPage() {
  const router = useRouter();
  const { addIncident, pushAlert } = useApp();

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const [landmark, setLandmark] = useState("");
  const [note, setNote] = useState("");
  const [severity, setSeverity] = useState<Severity>("blocked");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  /** Distinguishes "the model said nothing" from "the model has not run yet",
   *  so a defaulted type is never presented as a reading. */
  const [modelFailed, setModelFailed] = useState(false);
  const [kind, setKind] = useState<IncidentKind>("landslide");
  const [busy, setBusy] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Object URLs leak if you do not revoke them.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("That is not an image. Pick a photo of the road.");
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error("Photo is over 12 MB. Take a smaller one.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep(2);
    locate();
  }

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const at = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPoint(at);
        setLocating(false);
        // Prefill the landmark from the map, but never clobber what the reporter typed.
        void reverseGeocode(at).then((label) => {
          if (label) setLandmark((cur) => cur || label);
        });
      },
      () => { setLocating(false); toast.error("Location blocked. Type a landmark instead."); },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  async function classify() {
    if (!file) return;
    setBusy(true);
    setStep(3);
    setModelFailed(false);
    try {
      const r = await classifyIncident(file, point);
      setResult(r);
      setKind(r.kind);
      setSeverity(r.severity);
    } catch (e) {
      // The report is the point, not the model. Keep the form usable.
      const msg = e instanceof Error && e.message ? e.message : "Photo could not be read.";
      toast.error(`${msg} Set the type below and file it.`);
      setResult(null);
      setModelFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    try {
      const { id } = await submitReport({ kind, severity, point, landmark, note });
      addIncident({
        id, kind, severity,
        point: point ?? { lat: 25.5788, lng: 91.8933 },
        place: landmark || "Location pending verification",
        district: "Pending", state: "Meghalaya",
        reportedAt: new Date().toISOString(),
        source: "citizen",
        confidence: result?.confidence ?? 0.6,
        note: note || undefined,
        clearsInMin: null,
      });
      pushAlert({
        level: severity === "blocked" ? "danger" : "caution",
        title: `${KIND_LABEL[kind]} reported nearby`,
        body: `${landmark || "A location near you"} — drivers within 30 km have been notified.`,
      });
      toast.success(`Filed as ${id}`, { description: "Drivers within 30 km have been notified." });
      router.push("/map");
    } catch {
      toast.error("Could not file the report. It is saved and will send when signal returns.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setStep(1);
    setLandmark(""); setNote(""); setModelFailed(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16 pt-24 sm:px-8">
      <span className="eyebrow">Field report</span>
      <h1 className="t-h1 mt-2 text-balance">What is blocking the road?</h1>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ash">
        One photo is enough. The model reads the image, the phone supplies the position,
        and every driver heading that way is warned within a minute.
      </p>

      {/* Progress — three real stages, so numbering carries information */}
      <ol className="mt-8 flex items-center gap-2" aria-label="Progress">
        {(["Photo", "Place", "Confirm"] as const).map((s, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const now = step === n;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors",
                  done ? "border-clear bg-clear text-ink"
                    : now ? "border-signal text-signal"
                    : "border-hairline text-faint",
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
              </span>
              <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", now ? "text-bone" : "text-faint")}>
                {s}
              </span>
              {i < 2 && <span className="ml-1 h-px flex-1 bg-hairline/50" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-col gap-4">
        {/* ---- 1. Photo ---- */}
        {step === 1 && (
          <Panel contour className="a-rise p-6 sm:p-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
              className="rounded-xl border border-dashed border-hairline/70 px-6 py-12 text-center"
            >
              <Camera className="mx-auto h-7 w-7 text-glacier" strokeWidth={1.4} />
              <p className="mt-4 text-sm text-bone">Take a photo of the blockage</p>
              <p className="mt-1 text-xs text-faint">Or drop an image here</p>

              <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
                <button onClick={() => cameraRef.current?.click()} className="btn-signal">
                  <Camera className="h-4 w-4" /> Open camera
                </button>
                <button onClick={() => fileRef.current?.click()} className="btn-quiet">
                  <ImagePlus className="h-4 w-4" /> Choose a file
                </button>
              </div>

              <input
                ref={cameraRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={(e) => pick(e.target.files?.[0])}
              />
              <input
                ref={fileRef} type="file" accept="image/*"
                className="hidden" onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
          </Panel>
        )}

        {/* ---- 2. Place ---- */}
        {step === 2 && preview && (
          <Panel className="a-rise overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="The blockage you photographed" className="h-56 w-full object-cover sm:h-72" />

            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-2.5 rounded-lg border border-hairline/50 bg-slate-2/50 px-3.5 py-3">
                <MapPin className={cn("h-4 w-4 shrink-0", point ? "text-glacier" : "text-faint")} strokeWidth={1.8} />
                {locating ? (
                  <span className="text-xs text-ash">Getting your position…</span>
                ) : point ? (
                  <span className="readout text-xs text-bone">
                    {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                  </span>
                ) : (
                  <button onClick={locate} className="text-xs text-signal underline underline-offset-2">
                    Position unavailable. Try again
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="landmark" className="eyebrow">Nearest landmark</label>
                <input
                  id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)}
                  placeholder="NH-6, 4 km past Sohra viewpoint"
                  className="mt-1.5 w-full rounded-lg border border-hairline/60 bg-slate-2/70 px-3.5 py-2.5 text-sm text-bone placeholder:text-faint focus:border-signal"
                />
              </div>

              <div>
                <label htmlFor="note" className="eyebrow">Anything a driver should know</label>
                <textarea
                  id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Debris across both lanes. Water still coming down the slope."
                  className="mt-1.5 w-full resize-none rounded-lg border border-hairline/60 bg-slate-2/70 px-3.5 py-2.5 text-sm text-bone placeholder:text-faint focus:border-signal"
                />
              </div>

              <div className="flex gap-2.5">
                <button onClick={reset} className="btn-quiet shrink-0" aria-label="Start over">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={classify} className="btn-signal flex-1">Read the photo</button>
              </div>
            </div>
          </Panel>
        )}

        {/* ---- 3. Confirm ---- */}
        {step === 3 && (
          <Panel className="a-rise p-6 sm:p-8">
            {busy && !result ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-glacier" />
                <p className="mt-4 text-sm text-bone">Reading the photo</p>
                <p className="mt-1 text-xs text-faint">Comparing against 41,000 labelled field images</p>
              </div>
            ) : (
              <>
                {modelFailed ? (
                  <div className="rounded-[10px] border border-hairline/60 p-4">
                    <span className="eyebrow">Model unavailable</span>
                    <p className="mt-2 text-sm leading-relaxed text-bone">
                      The photo could not be read. Set the type below and file the
                      report — a report you classify yourself carries the same weight.
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="eyebrow">Model output</span>
                    <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
                      <span className="t-h2 text-signal">{KIND_LABEL[kind]}</span>
                      {result && (
                        <span className="readout text-sm text-ash">
                          {(result.confidence * 100).toFixed(1)}% confidence
                        </span>
                      )}
                    </p>
                  </>
                )}

                {result?.advisory && (
                  <div className="mt-4 rounded-[10px] border border-glacier/25 bg-glacier/6 p-4">
                    <span className="eyebrow text-glacier">Terrain risk engine</span>
                    <p className="mt-1.5 text-sm leading-relaxed text-bone">{result.advisory}</p>
                    {result.riskLevel && (
                      <p className="readout mt-2 text-[11px] text-faint">
                        Risk {result.riskLevel} ({result.riskScore}) · Accessibility {result.accessibility}
                      </p>
                    )}
                  </div>
                )}

                {result && (
                  <ul className="mt-5 flex flex-col gap-2">
                    {result.distribution.slice(0, 4).map((d) => (
                      <li key={d.kind} className="grid grid-cols-[7.5rem_1fr_2.6rem] items-center gap-3">
                        <span className="truncate text-xs text-ash">{KIND_LABEL[d.kind]}</span>
                        <span className="h-1 overflow-hidden rounded-full bg-hairline/40">
                          <span
                            className={cn("block h-full rounded-full", d.kind === kind ? "bg-signal" : "bg-hairline")}
                            style={{ width: `${d.p * 100}%` }}
                          />
                        </span>
                        <span className="readout text-right text-[11px] text-faint">
                          {(d.p * 100).toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="rule my-6" />

                <div>
                  <label htmlFor="kind" className="eyebrow">
                    {modelFailed ? "Set the type" : "Correct it if the model is wrong"}
                  </label>
                  <select
                    id="kind" value={kind} onChange={(e) => setKind(e.target.value as IncidentKind)}
                    className="mt-1.5 w-full appearance-none rounded-lg border border-hairline/60 bg-slate-2/70 px-3.5 py-2.5 text-sm text-bone focus:border-signal"
                  >
                    {Object.entries(KIND_LABEL).map(([v, l]) => (
                      <option key={v} value={v} className="bg-slate">{l}</option>
                    ))}
                  </select>
                </div>

                <fieldset className="mt-5">
                  <legend className="eyebrow">How bad is it?</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {SEVERITIES.map((s) => (
                      <button
                        key={s.v}
                        onClick={() => setSeverity(s.v)}
                        aria-pressed={severity === s.v}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left transition-colors",
                          severity === s.v
                            ? s.v === "blocked" ? "border-blocked/60 bg-blocked/12"
                              : s.v === "caution" ? "border-caution/60 bg-caution/12"
                              : "border-clear/60 bg-clear/12"
                            : "border-hairline/50 bg-slate-2/40 hover:border-hairline",
                        )}
                      >
                        <span className="block text-sm font-medium text-bone">{s.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-faint">{s.help}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-6 flex gap-2.5">
                  <button onClick={() => setStep(2)} className="btn-quiet shrink-0">Back</button>
                  <button onClick={send} disabled={busy} className="btn-signal flex-1">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    File the report
                  </button>
                </div>
              </>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
