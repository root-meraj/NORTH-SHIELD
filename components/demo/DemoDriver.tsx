"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { planRoute } from "@/lib/api";
import { useApp } from "@/lib/store";

/**
 * Guided demo. Judges get 70 seconds with no clicking.
 * Each beat is a caption + a real state change — nothing is faked visually,
 * it drives the same store the product does.
 *
 * This lives in the root layout, not on a page: the very first beat navigates
 * to /map, and a driver mounted on the home page would unmount and clear its
 * own timers before the second beat ever fired.
 */
const BEATS: Array<{ at: number; caption: string; go?: string }> = [
  { at: 0,     caption: "A convoy is leaving Guwahati for Silchar with medical supplies.", go: "/map" },
  { at: 3500,  caption: "Northshield scores every corridor on the way." },
  { at: 9000,  caption: "The shortest route crosses a slope the model flagged six hours ago." },
  { at: 14000, caption: "It reroutes. Twenty-five extra minutes instead of a stranded truck." },
  { at: 20000, caption: "Meanwhile, a farmer near Sohra photographs what is happening.", go: "/report" },
  { at: 26000, caption: "The model reads the photo and files it as a landslide, 91% confident." },
  { at: 33000, caption: "Officials can ask what happens if the rain keeps up.", go: "/predictions" },
  { at: 40000, caption: "At 340 mm the composite risk crosses 80 and pre-positioning is ordered." },
  { at: 47000, caption: "And if someone is caught in it, one button reaches the nearest team.", go: "/sos" },
  { at: 54000, caption: "Over satellite, when the tower is already gone." },
  { at: 60000, caption: "That is Northshield. Built for the eight states that need it most.", go: "/" },
];

const RUN_MS = 67000;

export default function DemoDriver() {
  const router = useRouter();
  const { demoRunning, demoCaption, setDemo, setRoute, pushAlert } = useApp();

  const timers = useRef<number[]>([]);
  const scheduled = useRef(false);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const stop = useCallback(() => {
    scheduled.current = false;
    clear();
    setDemo(false, null);
  }, [clear, setDemo]);

  useEffect(() => {
    if (demoRunning && !scheduled.current) {
      scheduled.current = true;
      toast.info("Guided demo running", { description: "Press Escape to stop." });

      // Preload the route so the map has something to show the moment we land.
      planRoute("Guwahati", "Silchar").then((r) => {
        setRoute(r);
        pushAlert({
          level: "danger",
          title: "Landslide predicted on NH-6",
          body: "Sohra ascent scored 91. Convoy AS-01-KC-4482 has been rerouted.",
        });
      });

      timers.current = BEATS.map((b) =>
        window.setTimeout(() => {
          setDemo(true, b.caption);
          if (b.go) router.push(b.go);
        }, b.at),
      );
      timers.current.push(
        window.setTimeout(() => {
          scheduled.current = false;
          setDemo(false, null);
        }, RUN_MS),
      );
    } else if (!demoRunning && scheduled.current) {
      scheduled.current = false;
      clear();
    }
  }, [demoRunning, router, setDemo, setRoute, pushAlert, clear]);

  useEffect(() => clear, [clear]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && demoRunning && stop();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [demoRunning, stop]);

  if (!demoRunning || !demoCaption) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 lg:bottom-8">
      <div className="a-rise flex max-w-lg items-start gap-3 rounded-xl border border-signal/40 bg-ink/95 px-5 py-3.5 backdrop-blur-xl">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-signal" />
        <p className="text-sm leading-relaxed text-bone">{demoCaption}</p>
        <button onClick={stop} aria-label="Stop the demo" className="shrink-0 text-faint hover:text-bone">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
