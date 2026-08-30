"use client";

import { create } from "zustand";
import { SEED_INCIDENTS } from "./data";
import type { GeoPoint, Incident, RouteResult } from "./types";

export type AlertLevel = "info" | "caution" | "danger" | "clear";

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

interface AppState {
  incidents: Incident[];
  alerts: Alert[];
  route: RouteResult | null;
  activeRouteId: "R-direct" | "R-safe";
  userPoint: GeoPoint | null;
  online: boolean;
  satelliteLocked: boolean;
  demoRunning: boolean;
  demoCaption: string | null;

  addIncident: (i: Incident) => void;
  pushAlert: (a: Omit<Alert, "id" | "at" | "read">) => void;
  markAllRead: () => void;
  setRoute: (r: RouteResult | null) => void;
  setActiveRoute: (id: "R-direct" | "R-safe") => void;
  setUserPoint: (p: GeoPoint | null) => void;
  setOnline: (v: boolean) => void;
  setDemo: (running: boolean, caption?: string | null) => void;
}

export const useApp = create<AppState>((set) => ({
  incidents: SEED_INCIDENTS,
  alerts: [],
  route: null,
  activeRouteId: "R-safe",
  userPoint: null,
  online: true,
  satelliteLocked: true,
  demoRunning: false,
  demoCaption: null,

  addIncident: (i) => set((s) => ({ incidents: [i, ...s.incidents] })),
  pushAlert: (a) =>
    set((s) => ({
      alerts: [
        { ...a, id: `A${Date.now()}${Math.random().toString(36).slice(2, 6)}`, at: Date.now(), read: false },
        ...s.alerts,
      ].slice(0, 40),
    })),
  markAllRead: () => set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),
  setRoute: (route) => set({ route }),
  setActiveRoute: (activeRouteId) => set({ activeRouteId }),
  setUserPoint: (userPoint) => set({ userPoint }),
  setOnline: (online) => set({ online }),
  setDemo: (demoRunning, demoCaption = null) => set({ demoRunning, demoCaption }),
}));

export const unreadCount = (a: Alert[]) => a.filter((x) => !x.read).length;
