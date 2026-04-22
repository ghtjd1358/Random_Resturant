"use client";

import { create } from "zustand";
import type { LocationPreset } from "@/lib/geo/presets";

export type PermissionState = "unknown" | "prompt" | "granted" | "denied";
export type CoordsSource = "gps" | "preset";

interface Coords {
  lat: number;
  lng: number;
  accuracy?: number;
  /** epoch ms when this fix was captured. */
  updatedAt: number;
}

interface LocationState {
  coords: Coords | null;
  permission: PermissionState;
  error: string | null;
  source: CoordsSource;
  presetId: string | null;
  /** Sets GPS-sourced coords (also clears any active preset). */
  setCoords: (c: Coords | null) => void;
  setPreset: (p: LocationPreset) => void;
  /** Clears preset selection; coords become null so GPS can take over. */
  clearPreset: () => void;
  setPermission: (p: PermissionState) => void;
  setError: (e: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  permission: "unknown",
  error: null,
  source: "gps",
  presetId: null,
  setCoords: (coords) =>
    set(coords ? { coords, source: "gps", presetId: null } : { coords: null }),
  setPreset: (p) =>
    set({
      coords: { lat: p.lat, lng: p.lng, updatedAt: Date.now() },
      source: "preset",
      presetId: p.id,
      error: null,
    }),
  clearPreset: () => set({ coords: null, source: "gps", presetId: null }),
  setPermission: (permission) => set({ permission }),
  setError: (error) => set({ error }),
}));

export const LOCATION_STALE_MS = 2 * 60 * 1000; // 2 minutes

export function isStale(updatedAt: number, thresholdMs = LOCATION_STALE_MS): boolean {
  return Date.now() - updatedAt > thresholdMs;
}
