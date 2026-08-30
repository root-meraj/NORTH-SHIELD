"use client";

import { useEffect } from "react";
import { WifiOff } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * Watches the network and surfaces a persistent banner when it drops.
 * Copy states what happens next, not just that something is wrong.
 */
export default function ConnectivityWatch() {
  const { online, setOnline } = useApp();

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [setOnline]);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-14 z-40 flex items-center justify-center gap-2 border-b border-caution/30 bg-caution/12 px-4 py-2 backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-caution" strokeWidth={2} />
      <p className="text-center text-xs text-caution">
        No cellular link. Showing the last sync. Reports queue and send when signal returns.
      </p>
    </div>
  );
}
