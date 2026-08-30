"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Languages, Satellite, X } from "lucide-react";

import { useApp, unreadCount } from "@/lib/store";
import { ago, cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/predictions", label: "Forecast" },
  { href: "/report", label: "Report" },
  { href: "/sos", label: "SOS" },
];

const LANGS = ["EN", "हिं", "অস", "বাং", "মৈ"];

export default function TopNav() {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [lang, setLang] = useState("EN");
  const { alerts, markAllRead, online, satelliteLocked } = useApp();
  const unread = unreadCount(alerts);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-hairline/40 bg-ink/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-shell items-center gap-6 px-5 sm:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            {/* Mark: a contour ring cut by a route line */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="rgb(47 79 71)" strokeWidth="1.4" />
              <circle cx="12" cy="12" r="5.5" fill="none" stroke="rgb(47 79 71)" strokeWidth="1.4" />
              <path d="M2 17 Q 9 9 14 13 T 22 6" fill="none" stroke="rgb(255 107 53)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[15px] font-semibold tracking-tight">Northshield</span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const active = path === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition-colors",
                      active ? "bg-slate-2 text-bone" : "text-ash hover:text-bone",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Link status — an operator needs to know if the data is stale */}
            <span
              className={cn(
                "pill hidden shrink-0 sm:inline-flex",
                online
                  ? "border-clear/35 bg-clear/10 text-clear"
                  : "border-caution/40 bg-caution/10 text-caution",
              )}
              title={online ? "Cellular link up" : "Cellular down — satellite fallback"}
            >
              <Satellite className="h-3 w-3" strokeWidth={2} />
              {online ? "Linked" : satelliteLocked ? "Satellite" : "No link"}
            </span>

            {/* Language: cycles the label; strings load from next-intl later */}
            <button
              onClick={() => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length])}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-ash transition-colors hover:bg-slate-2 hover:text-bone"
              aria-label={`Language: ${lang}. Change language`}
            >
              <Languages className="h-4 w-4" strokeWidth={1.6} />
              <span className="readout text-[11px]">{lang}</span>
            </button>

            <button
              onClick={() => { setDrawer(true); markAllRead(); }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ash transition-colors hover:bg-slate-2 hover:text-bone"
              aria-label={unread ? `${unread} unread alerts` : "Alerts"}
            >
              <Bell className="h-4 w-4" strokeWidth={1.6} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 font-mono text-[9px] font-bold text-ink">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Alerts drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Alerts">
          <button
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
            aria-label="Close alerts"
          />
          <aside className="a-rise absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-hairline/50 bg-slate">
            <div className="flex items-center justify-between border-b border-hairline/40 px-5 py-4">
              <h2 className="font-display text-base font-semibold tracking-tight">Alerts</h2>
              <button
                onClick={() => setDrawer(false)}
                className="rounded-lg p-1.5 text-ash hover:bg-slate-2 hover:text-bone"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <p className="text-sm text-ash">Nothing to report.</p>
                  <p className="mt-1 text-xs text-faint">
                    Alerts appear here when a corridor near you changes status.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-hairline/30">
                  {alerts.map((a) => (
                    <li key={a.id} className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            a.level === "danger" ? "bg-blocked"
                              : a.level === "caution" ? "bg-caution"
                              : a.level === "clear" ? "bg-clear" : "bg-glacier",
                          )}
                        />
                        <p className="text-sm font-medium text-bone">{a.title}</p>
                        <span className="readout ml-auto text-[10px] text-faint">
                          {ago(new Date(a.at).toISOString())}
                        </span>
                      </div>
                      <p className="mt-1.5 pl-3.5 text-sm leading-relaxed text-ash">{a.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
