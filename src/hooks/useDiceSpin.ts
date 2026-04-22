"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnimationControls } from "motion/react";

type AnimationControls = ReturnType<typeof useAnimationControls>;
import type { Category } from "@/lib/places/types";

const FOOD_EMOJIS = [
  "🍜", "🍣", "🍱", "🍙", "🍘", "🍛", "🍝", "🍤", "🥟",
  "🍔", "🍕", "🍲", "🥘", "🍖", "🍗", "🍟", "🍚", "🍢", "🍡",
];
const CAFE_EMOJIS = [
  "☕", "🍵", "🧋", "🧁", "🍰", "🎂", "🥐", "🥞", "🧇", "🍮", "🍩", "🍪",
];

const SPIN_INTERVAL_MS = 90;
const SPIN_MIN_MS = 2200;
const SPIN_MAX_MS = 3800;
const SPIN_HARD_TIMEOUT_MS = 8000;

const PHASES: { at: number; text: string }[] = [
  { at: 0, text: "근처 훑어보는 중" },
  { at: 900, text: "평점 살피는 중" },
  { at: 1800, text: "후보 좁히는 중" },
  { at: 2600, text: "고르는 중" },
];

function pickDifferent(list: string[], prev: string): string {
  if (list.length <= 1) return list[0] ?? prev;
  const idx = Math.floor(Math.random() * list.length);
  const next = list[idx];
  if (next !== prev) return next;
  return list[(idx + 1) % list.length];
}

export interface UseDiceSpin {
  /** Current emoji on display. */
  emoji: string;
  /** Animation controls to bind to the spinning element. */
  controls: AnimationControls;
  /** Active phase text during a spin, or null when idle. */
  phaseText: string | null;
  /** Start a spin that lasts 2.2~3.8s while running `job` in parallel. */
  spin: <T>(job: () => Promise<T>) => Promise<T | undefined>;
  /** Whether a spin is currently in progress. */
  isSpinning: boolean;
}

/**
 * Encapsulates the dice UI: emoji cycle, phase labels, scale/rotate animation,
 * and minimum-duration guarantee. Returns just the bindings the view needs.
 */
export function useDiceSpin(category: Category): UseDiceSpin {
  const emojis = category === "food" ? FOOD_EMOJIS : CAFE_EMOJIS;
  const controls = useAnimationControls();
  const spinningRef = useRef(false);
  const [emoji, setEmoji] = useState(() => emojis[0]);
  const [phaseText, setPhaseText] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Reshuffle idle emoji on category change
  useEffect(() => {
    setEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
  }, [emojis, category]);

  const spin = useCallback(
    async <T,>(job: () => Promise<T>): Promise<T | undefined> => {
      if (spinningRef.current) return undefined;
      spinningRef.current = true;
      setIsSpinning(true);

      const duration = SPIN_MIN_MS + Math.random() * (SPIN_MAX_MS - SPIN_MIN_MS);

      const cycle = window.setInterval(() => {
        setEmoji((prev) => pickDifferent(emojis, prev));
      }, SPIN_INTERVAL_MS);

      const phaseTimers = PHASES.map(({ at, text }) =>
        window.setTimeout(() => setPhaseText(text), at),
      );

      const hardStop = window.setTimeout(() => {
        window.clearInterval(cycle);
        phaseTimers.forEach(window.clearTimeout);
        setPhaseText(null);
        setIsSpinning(false);
        spinningRef.current = false;
      }, SPIN_HARD_TIMEOUT_MS);

      const startedAt = Date.now();
      const minDurationPromise = new Promise<void>((resolve) =>
        setTimeout(resolve, duration),
      );

      try {
        const [result] = await Promise.all([
          job(),
          controls.start({
            scale: [1, 1.12, 0.95, 1.08, 0.98, 1.04, 1],
            rotate: [0, -5, 5, -3, 3, -2, 0],
            transition: { duration: duration / 1000, ease: [0.22, 1, 0.36, 1] },
          }),
          minDurationPromise,
        ]);
        return result;
      } catch {
        return undefined;
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = duration - elapsed;
        if (remaining > 0 && remaining < duration) {
          await new Promise((r) => setTimeout(r, remaining));
        }
        window.clearInterval(cycle);
        phaseTimers.forEach(window.clearTimeout);
        window.clearTimeout(hardStop);
        setPhaseText(null);
        setIsSpinning(false);
        spinningRef.current = false;
      }
    },
    [controls, emojis],
  );

  return { emoji, controls, phaseText, spin, isSpinning };
}
