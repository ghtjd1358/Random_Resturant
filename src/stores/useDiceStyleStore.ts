"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Visual style for the home dice button.
 *   - "classic": static `選` glyph + 朱 dot. Quiet, signature.
 *   - "rotating": cycles through food/cafe kanji while rolling, settling on
 *     `選` when idle. More playful.
 *
 * Persisted so the user's choice survives reloads / PWA cold starts.
 */
export type DiceStyle = "classic" | "rotating";

interface DiceStyleState {
  style: DiceStyle;
  setStyle: (s: DiceStyle) => void;
}

export const useDiceStyleStore = create<DiceStyleState>()(
  persist(
    (set) => ({
      // Default to rotating — kanji cycling reads as the "alive" version of
      // the dice and most users prefer it once they see it. Existing users
      // keep whatever they already chose (persist hydrates first).
      style: "rotating",
      setStyle: (style) => set({ style }),
    }),
    { name: "rr-dice-style" },
  ),
);
