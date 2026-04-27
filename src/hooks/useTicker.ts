"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Returns the current wall-clock time, refreshed every `intervalMs`.
 *
 * Uses useSyncExternalStore so reading `Date.now()` happens via React's
 * snapshot mechanism — sidesteps the `react-hooks/purity` rule that flags
 * direct `Date.now()` reads during render. Also gives us a clean SSR
 * snapshot (0) without hydration mismatch.
 *
 * `enabled = false` freezes the timer so unused tickers don't burn battery.
 */
export function useNow(intervalMs: number, enabled = true): number {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!enabled) return () => {};
      const id = window.setInterval(cb, intervalMs);
      return () => window.clearInterval(id);
    },
    [intervalMs, enabled],
  );
  return useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => 0,
  );
}
