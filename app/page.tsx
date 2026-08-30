import Link from "next/link";
import { ArrowUpRight, Radio, Route as RouteIcon, Waves } from "lucide-react";

import ContourField from "@/components/terrain/ContourField";
import LiveClock from "@/components/ui/LiveClock";
import CountUp from "@/components/ui/CountUp";
import IncidentFeed from "@/components/ui/IncidentFeed";
import CorridorTable from "@/components/ui/CorridorTable";
import ConvoyBoard from "@/components/ui/ConvoyBoard";
import TelegramAlertLog from "@/components/ui/TelegramAlertLog";
import DemoLauncher from "@/components/demo/DemoLauncher";
import { SEED_CORRIDORS } from "@/lib/data";

/**
 * The landing page IS the dashboard. A visitor sees the pitch in the first
 * screen and the live operations picture on the second — no separate marketing
 * site, because an operations product should prove itself immediately.
 */
export default function Home() {
  const blocked = SEED_CORRIDORS.filter((c) => c.status === "blocked").length;

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative isolate flex min-h-[92dvh] items-end overflow-hidden border-b border-hairline/40">
        <ContourField />

        <div className="relative mx-auto w-full max-w-shell px-5 pb-14 pt-28 sm:px-8 lg:pb-24">
          <div className="a-rise flex items-center gap-3">
            <span className="pill border-signal/45 bg-signal/10 text-signal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              Live · 8 states
            </span>
            <LiveClock />
          </div>

          {/* One arrival, five beats, 80ms apart: pill, headline, subhead,
              buttons, stats. Read as a sequence, not four separate fades. */}
          <h1 className="a-rise t-hero mt-7 max-w-[19ch] text-balance" style={{ animationDelay: "80ms" }}>
            The slope moves
            <br />
            <span className="text-signal">six hours</span> before
            <br />
            the road does.
          </h1>

          <p
            className="a-rise mt-6 max-w-[52ch] text-pretty text-base leading-relaxed text-ash sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Northshield reads rainfall, slope saturation and seismic drift across the eight
            North Eastern states, predicts where a corridor will fail, and moves people and
            supply convoys off it before it does.
          </p>

          <div className="a-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: "240ms" }}>
            <Link href="/map" className="btn-signal w-full sm:w-auto">
              <RouteIcon className="h-4 w-4" />
              Plan a safe route
            </Link>
            <DemoLauncher />
          </div>

          {/* Readout strip — the numbers an operator checks first */}
          <dl
            className="a-rise mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline/50 bg-hairline/30 sm:grid-cols-4"
            style={{ animationDelay: "320ms" }}
          >
            {[
              { k: "Corridors watched", v: 128, suffix: "" },
              { k: "Impassable now", v: blocked, suffix: "", hot: true },
              { k: "Convoys tracked", v: 1204, suffix: "" },
              { k: "Lead time, median", v: 5.8, suffix: " h" },
            ].map((s) => (
              <div key={s.k} className="bg-ink/80 px-4 py-5 backdrop-blur-sm sm:px-5">
                <dt className="eyebrow">{s.k}</dt>
                {/* Impassable reads in the blocked token, not signal — signal
                    belongs to the route button, and one view gets one. */}
                <dd className={`readout mt-2 text-2xl sm:text-3xl ${s.hot ? "text-blocked" : "text-bone"}`}>
                  <CountUp to={s.v} decimals={s.v % 1 !== 0 ? 1 : 0} />
                  {s.suffix}
                </dd>
              </div>
            ))}
          </dl>

          {/* Scroll cue. Without it the operations sheet below reads as the
              end of the page on a phone. */}
          <div
            className="a-rise mt-10 flex flex-col items-center gap-2"
            style={{ animationDelay: "400ms" }}
          >
            <span className="eyebrow">Operations</span>
            <span
              className="h-6 w-px bg-gradient-to-b from-hairline to-transparent"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* ================= OPERATIONS ================= */}
      <section className="mx-auto max-w-shell px-5 py-14 sm:px-8 lg:py-20">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Sheet 01 — Current picture</span>
            <h2 className="t-h1 mt-2">Operations</h2>
          </div>
          <Link
            href="/map"
            className="group inline-flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-bone"
          >
            Open the map
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <IncidentFeed />
          <div className="flex flex-col gap-5">
            <CorridorTable />
            <ConvoyBoard />
          </div>
        </div>

        {/* Telegram alert delivery log — visible during demo */}
        <div className="mt-5">
          <TelegramAlertLog />
        </div>
      </section>

      {/* ================= METHOD ================= */}
      <section className="border-t border-hairline/40 bg-slate/30">
        <div className="mx-auto max-w-shell px-5 py-14 sm:px-8 lg:py-20">
          <span className="eyebrow">Sheet 02 — Method</span>
          <h2 className="t-h1 mt-2 max-w-[16ch] text-balance">
            Three things happen, in this order.
          </h2>

          {/* Numbered because it genuinely is a sequence. */}
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline/50 bg-hairline/30 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Waves,
                h: "Sense",
                p: "Rainfall gauges, IMD forecasts, Sentinel-1 ground deformation and citizen photos feed one model per district.",
              },
              {
                n: "02",
                icon: RouteIcon,
                h: "Predict",
                p: "The model scores every corridor hourly and names the kilometre where it expects failure — not just the district.",
              },
              {
                n: "03",
                icon: Radio,
                h: "Move",
                p: "Drivers get a new route. Officials get a pre-positioning order. Both work offline over satellite when the tower drops.",
              },
            ].map((s) => (
              <li key={s.n} className="group bg-ink/60 p-6 transition-colors hover:bg-slate-2/60 sm:p-8">
                <div className="flex items-start justify-between">
                  <s.icon className="h-5 w-5 text-glacier" strokeWidth={1.5} />
                  <span className="readout text-xs text-faint">{s.n}</span>
                </div>
                <h3 className="t-h2 mt-6">{s.h}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ash">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-hairline/40">
        <div className="mx-auto flex max-w-shell flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display text-sm font-semibold tracking-tight">
            Northshield
            <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-faint">
              SIH · MDoNER
            </span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            Data: IMD · Bhuvan · Sentinel-1 · field reports
          </p>
        </div>
      </footer>
    </>
  );
}
