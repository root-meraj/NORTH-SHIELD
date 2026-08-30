"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Map, Camera, TriangleAlert, CloudRain, ChartColumn } from "lucide-react";
import { cn } from "@/lib/utils";

/** TopNav's links are desktop-only, so anything not listed here is
 *  unreachable on a phone. */
const TABS = [
  { href: "/",            label: "Home",     icon: LayoutGrid },
  { href: "/dashboard",   label: "Board",    icon: ChartColumn },
  { href: "/map",         label: "Map",      icon: Map },
  { href: "/sos",         label: "SOS",      icon: TriangleAlert, center: true },
  { href: "/report",      label: "Report",   icon: Camera },
  { href: "/predictions", label: "Forecast", icon: CloudRain },
];

/** Thumb-reach navigation. SOS sits centre because in an emergency you do not aim. */
export default function MobileTabBar() {
  const path = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline/50 bg-ink/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-2">
        {TABS.map((t) => {
          const active = path === t.href;

          if (t.center) {
            return (
              <li key={t.href} className="-mt-6">
                <Link
                  href={t.href}
                  aria-label="Emergency SOS"
                  className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-blocked text-bone transition-transform active:scale-95"
                  style={{ boxShadow: "0 0 0 4px rgb(12 20 22), 0 8px 28px -8px rgb(214 40 40 / 0.9)" }}
                >
                  <t.icon className="h-5 w-5" strokeWidth={2.2} />
                  <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em]">SOS</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-2 transition-colors",
                  active ? "text-signal" : "text-faint hover:text-ash",
                )}
              >
                <t.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.6} />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
