"use client";

import { motion } from "motion/react";

/**
 * Inspired by a Japanese noren (暖簾) — the short split curtain hung at a
 * restaurant's entrance. Top bar = rod, slats = fabric panels, with a subtle
 * shadow cast underneath for weight.
 */
export function NoirenDivider({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      <svg
        viewBox="0 0 240 24"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="h-5 w-full"
      >
        <defs>
          <linearGradient id="noren-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8102E" />
            <stop offset="90%" stopColor="#A00C24" />
          </linearGradient>
          <linearGradient id="noren-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 245, 230, 0.18)" />
            <stop offset="100%" stopColor="rgba(255, 245, 230, 0)" />
          </linearGradient>
        </defs>

        {/* Hanging rod */}
        <rect x="0" y="0" width="240" height="2.5" rx="1" fill="#2B2B2B" opacity="0.85" />
        {/* Rod pegs at ends */}
        <rect x="2" y="0.5" width="3" height="2" rx="0.8" fill="#8B5A2B" opacity="0.85" />
        <rect x="235" y="0.5" width="3" height="2" rx="0.8" fill="#8B5A2B" opacity="0.85" />

        {/* Fabric slats — 7 panels with slight height variance for organic feel */}
        {[
          { x: 2, w: 32, h: 18 },
          { x: 36, w: 32, h: 19 },
          { x: 70, w: 32, h: 18 },
          { x: 104, w: 32, h: 20 },
          { x: 138, w: 32, h: 18 },
          { x: 172, w: 32, h: 19 },
          { x: 206, w: 32, h: 18 },
        ].map((s, i) => (
          <g key={i}>
            <rect
              x={s.x}
              y={2.5}
              width={s.w}
              height={s.h}
              rx={1}
              fill="url(#noren-grad)"
            />
            {/* Highlight gradient on each panel for light-from-above feel */}
            <rect
              x={s.x}
              y={2.5}
              width={s.w}
              height={s.h * 0.55}
              rx={1}
              fill="url(#noren-shine)"
            />
          </g>
        ))}

        {/* Center panels carry a faint 食 (food) character */}
        <text
          x="120"
          y="16"
          textAnchor="middle"
          fontSize="9"
          fontFamily="serif"
          fill="#FAF6EE"
          opacity="0.45"
          fontWeight="bold"
        >
          食
        </text>

        {/* Soft ground shadow under noren */}
        <rect
          x="0"
          y="22"
          width="240"
          height="1.5"
          fill="#2B2B2B"
          opacity="0.08"
        />
      </svg>
    </motion.div>
  );
}
