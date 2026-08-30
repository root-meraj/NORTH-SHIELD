"use client";
import { useEffect, useState } from "react";

/** IST clock. Client-only render avoids a hydration mismatch. */
export default function LiveClock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "Asia/Kolkata",
      });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="readout text-[11px] text-faint">
      {t ?? "--:--:--"} <span className="text-[9px] uppercase tracking-[0.18em]">IST</span>
    </span>
  );
}
