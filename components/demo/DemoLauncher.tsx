"use client";

import { Play } from "lucide-react";

import { useApp } from "@/lib/store";

/**
 * Just the trigger. The demo itself is driven by DemoDriver in the root
 * layout, which survives the navigation the first beat performs.
 */
export default function DemoLauncher() {
  const { demoRunning, setDemo } = useApp();

  return (
    <button
      onClick={() => setDemo(!demoRunning, null)}
      className="btn-quiet w-full sm:w-auto"
    >
      <Play className="h-4 w-4" />
      {demoRunning ? "Stop the demo" : "Watch the 60-second demo"}
    </button>
  );
}
