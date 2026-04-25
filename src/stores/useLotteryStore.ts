"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StickCount = 3 | 5;
/** Animation metaphor for the lottery modal — both 3D, user picks. */
export type LotteryStyle = "kuji" | "yabawi";

interface LotteryState {
  /** Number of sticks loaded into the kuji cylinder per draw. */
  stickCount: StickCount;
  setStickCount: (n: StickCount) => void;
  /** Which 3D animation runs when picks are drawn. */
  style: LotteryStyle;
  setStyle: (s: LotteryStyle) => void;
}

export const useLotteryStore = create<LotteryState>()(
  persist(
    (set) => ({
      stickCount: 5,
      setStickCount: (stickCount) => set({ stickCount }),
      style: "kuji",
      setStyle: (style) => set({ style }),
    }),
    { name: "rr-lottery" },
  ),
);
