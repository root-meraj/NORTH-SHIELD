"use client";

import { useEffect, useState } from "react";
import { Send, Check, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TelegramLogEntry {
  id: string;
  time: string;
  type: string;
  title: string;
  status: "sending" | "sent" | "failed" | "skipped";
}

// Global log that other components can push to
let _listeners: Array<(entries: TelegramLogEntry[]) => void> = [];
let _entries: TelegramLogEntry[] = [];

export function pushTelegramLog(entry: Omit<TelegramLogEntry, "id" | "time">) {
  const full: TelegramLogEntry = {
    ...entry,
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }),
  };
  _entries = [full, ..._entries].slice(0, 20);
  _listeners.forEach((fn) => fn([..._entries]));
  return full.id;
}

export function updateTelegramLog(id: string, status: TelegramLogEntry["status"]) {
  _entries = _entries.map((e) => (e.id === id ? { ...e, status } : e));
  _listeners.forEach((fn) => fn([..._entries]));
}

const TYPE_ICON: Record<string, string> = {
  road_blocked: "🚫",
  sos: "🆘",
  high_risk: "⚠️",
  landslide: "⛰️",
  flood: "🌊",
  road_damage: "🛣️",
  reroute: "🔄",
  prediction: "📊",
  default: "📢",
};

const STATUS_STYLE = {
  sending: { icon: Clock, text: "Sending…", color: "text-caution" },
  sent: { icon: Check, text: "Delivered", color: "text-clear" },
  failed: { icon: AlertTriangle, text: "Failed", color: "text-blocked" },
  skipped: { icon: AlertTriangle, text: "Skipped", color: "text-faint" },
} as const;

/**
 * Shows a live feed of Telegram alerts being sent — visible proof for judges
 * that the notification pipeline is real and working.
 */
export default function TelegramAlertLog() {
  const [entries, setEntries] = useState<TelegramLogEntry[]>(_entries);

  useEffect(() => {
    _listeners.push(setEntries);
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setEntries);
    };
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="a-rise overflow-hidden rounded-xl border border-hairline/50 bg-slate/60 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 border-b border-hairline/40 px-5 py-3.5">
        <Send className="h-4 w-4 text-glacier" strokeWidth={1.6} />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-bone">
          Telegram Alert Log
        </span>
        <span className="ml-auto flex h-5 items-center rounded-full bg-glacier/15 px-2 font-mono text-[10px] text-glacier">
          {entries.filter((e) => e.status === "sent").length} delivered
        </span>
      </div>
      <ul className="divide-y divide-hairline/25 max-h-64 overflow-y-auto">
        {entries.map((entry, i) => {
          const S = STATUS_STYLE[entry.status];
          return (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3 transition-colors",
                i === 0 && entry.status === "sent" && "bg-clear/5",
              )}
            >
              <span className="text-base leading-none">
                {TYPE_ICON[entry.type] ?? TYPE_ICON.default}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-bone">
                  {entry.title}
                </span>
                <span className="block text-[11px] text-faint">{entry.time} IST</span>
              </span>
              <span className={cn("flex items-center gap-1 shrink-0", S.color)}>
                <S.icon className="h-3 w-3" strokeWidth={2} />
                <span className="font-mono text-[10px]">{S.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
