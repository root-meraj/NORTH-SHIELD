import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity } from "./types";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

/** Status -> token class. One source of truth so colour never drifts. */
export const SEV: Record<Severity, { text: string; bg: string; ring: string; label: string }> = {
  clear:   { text: "text-clear",   bg: "bg-clear/12",   ring: "border-clear/40",   label: "Passable" },
  caution: { text: "text-caution", bg: "bg-caution/12", ring: "border-caution/40", label: "Degraded" },
  blocked: { text: "text-blocked", bg: "bg-blocked/14", ring: "border-blocked/45", label: "Impassable" },
};

export function riskToSeverity(risk: number): Severity {
  return risk >= 70 ? "blocked" : risk >= 40 ? "caution" : "clear";
}

/** "4 min ago" without pulling a locale bundle for one string. */
export function ago(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
