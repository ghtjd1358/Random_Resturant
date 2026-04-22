"use client";

import { create } from "zustand";
import type { PlaceLite } from "@/lib/places/types";

type RollStatus = "idle" | "locating" | "rolling" | "ready" | "error";

interface SessionState {
  status: RollStatus;
  currentPick: PlaceLite | null;
  candidates: PlaceLite[];
  lastPickedIds: string[]; // ring buffer, most recent first
  errorMessage: string | null;

  setStatus: (s: RollStatus) => void;
  setCurrentPick: (p: PlaceLite | null) => void;
  setCandidates: (c: PlaceLite[]) => void;
  pushPickedId: (id: string) => void;
  clearError: () => void;
  setError: (msg: string) => void;
  reset: () => void;
}

const LAST_PICKED_LIMIT = 3;

export const useSessionStore = create<SessionState>((set) => ({
  status: "idle",
  currentPick: null,
  candidates: [],
  lastPickedIds: [],
  errorMessage: null,

  setStatus: (status) => set({ status }),
  setCurrentPick: (currentPick) => set({ currentPick }),
  setCandidates: (candidates) => set({ candidates }),
  pushPickedId: (id) =>
    set((s) => ({
      lastPickedIds: [id, ...s.lastPickedIds.filter((x) => x !== id)].slice(
        0,
        LAST_PICKED_LIMIT,
      ),
    })),
  clearError: () => set({ errorMessage: null, status: "idle" }),
  setError: (msg) => set({ errorMessage: msg, status: "error" }),
  reset: () =>
    set({
      status: "idle",
      currentPick: null,
      candidates: [],
      lastPickedIds: [],
      errorMessage: null,
    }),
}));
