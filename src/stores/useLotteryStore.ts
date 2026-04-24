"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StickCount = 3 | 5;

interface LotteryState {
  /** Number of sticks loaded into the kuji cylinder per draw. */
  stickCount: StickCount;
  setStickCount: (n: StickCount) => void;
}

export const useLotteryStore = create<LotteryState>()(
  persist(
    (set) => ({
      stickCount: 5,
      setStickCount: (stickCount) => set({ stickCount }),
    }),
    { name: "rr-lottery" },
  ),
);
