"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TokyoArrivalState {
  /** True once the 도쿄 도착 intro has played for this device. */
  sealed: boolean;
  seal: () => void;
  unseal: () => void;
}

export const useTokyoArrivalStore = create<TokyoArrivalState>()(
  persist(
    (set) => ({
      sealed: false,
      seal: () => set({ sealed: true }),
      unseal: () => set({ sealed: false }),
    }),
    { name: "rr-tokyo-arrival" },
  ),
);
