"use client";

import { useEffect, useState } from "react";

/**
 * Forces a re-render on a fixed interval. Useful for time-based displays
 * (e.g. "3분 전") that should refresh without a data change.
 */
export function useTicker(intervalMs: number, enabled = true): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);

  return tick;
}
