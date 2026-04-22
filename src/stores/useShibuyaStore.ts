"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShibuyaState {
  /** True once the Shibuya Incident intro has played for this device. */
  sealed: boolean;
  seal: () => void;
  unseal: () => void;
}

export const useShibuyaStore = create<ShibuyaState>()(
  persist(
    (set) => ({
      sealed: false,
      seal: () => set({ sealed: true }),
      unseal: () => set({ sealed: false }),
    }),
    { name: "rr-shibuya" },
  ),
);
