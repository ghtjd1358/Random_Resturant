"use client";

/**
 * Tiny wrapper around navigator.vibrate. Most desktop browsers return false
 * silently, which is fine — we treat haptics as progressive enhancement.
 */
const SUPPORTED =
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

function fire(pattern: number | number[]): void {
  if (!SUPPORTED) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Swallowed — some iOS versions throw despite having the API. */
  }
}

// Lightly distinct patterns — the user can "hear" the meaning through feel.
export const haptic = {
  tap: () => fire(10),
  rollStart: () => fire(8),
  rollEnd: () => fire([10, 30, 10, 60]),
  positive: () => fire(15),
  negative: () => fire([30, 20, 30]),
  select: () => fire(5),
};
