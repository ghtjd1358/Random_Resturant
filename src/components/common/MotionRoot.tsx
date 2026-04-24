"use client";

import { MotionConfig } from "motion/react";

/**
 * Root motion provider — set once in the layout so every motion/react
 * component inside respects the OS-level "reduce motion" preference.
 * Pairs with the @media (prefers-reduced-motion) block in globals.css
 * which handles plain CSS keyframes.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
