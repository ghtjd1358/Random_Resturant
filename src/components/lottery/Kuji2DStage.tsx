"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";

/**
 * Kuji 2D Stage — flat woodblock-print bamboo can + sticks.
 *
 * Same flat-only constraints as Yabawi2DStage:
 *   - Pure flat fills (no gradients)
 *   - Single sumi outline weight per element
 *   - Visual depth comes from layering + motion, never gradient mimicry
 *
 * Sticks are rendered IN FRONT of the can (we don't try to fake "sticks
 * inside a can hidden by the body" in 2D — that's where SVG kuji always
 * looked off). Instead the sticks visibly stand in the can's mouth, like
 * a stylized woodblock illustration.
 */

const SHAKE_MS = 1400;
const SETTLED_MS = 320;
const REVEAL_MS = 1000;

const STICK_LABELS = ["吉", "中", "末", "小", "凶"];

interface StageProps {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  count: number;
  onStart: () => void;
}

export function Kuji2DStage({ phase, winnerIdx, count, onStart }: StageProps) {
  // Cylinder shake — keyframe array with anticipation + decay + follow-through
  const cylinderVariants: Variants = {
    ready: { rotate: 0, x: 0, y: 0 },
    shuffling: {
      rotate: [0, -3, -1, -7, 6, -4, 3, -1, 0, 1, -0.5, 0],
      x: [0, -2, 1, -3, 2, -1, 1, 0, 0, 0.5, 0, 0],
      y: [0, -1, 0, -2, 0, -1, 0, 0, 0, 0, 0, 0],
      transition: {
        duration: SHAKE_MS / 1000,
        times: [0, 0.05, 0.1, 0.2, 0.32, 0.45, 0.58, 0.7, 0.82, 0.88, 0.94, 1],
        ease: "easeInOut",
      },
    },
    settled: {
      rotate: [0, -1, 0],
      x: 0,
      y: 0,
      transition: { duration: SETTLED_MS / 1000, ease: [0.22, 1, 0.36, 1] },
    },
    revealing: {
      rotate: [-2, 0],
      x: 0,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const sticks = Array.from({ length: count }, (_, i) => {
    const restRot = Number(((i - (count - 1) / 2) * 5).toFixed(1));
    return {
      idx: i,
      restRot,
      label: STICK_LABELS[i % STICK_LABELS.length],
    };
  });

  return (
    <button
      type="button"
      onClick={phase === "ready" ? onStart : undefined}
      disabled={phase !== "ready"}
      aria-label="제비뽑기 시작"
      className="no-select relative h-full w-full"
    >
      {/* Center-anchored stage container */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 transform-gpu"
        style={{
          bottom: 30,
          width: 200,
          height: 320,
          transformOrigin: "50% 90%",
          willChange: "transform",
        }}
        variants={cylinderVariants}
        animate={phase}
      >
        {/* Sticks — render BEHIND the can front in z-order. The can SVG
            top portion overlaps the stick bases so the sticks look like
            they emerge from inside. */}
        {sticks.map((s) => (
          <Stick
            key={s.idx}
            idx={s.idx}
            restRot={s.restRot}
            label={s.label}
            phase={phase}
            isWinner={winnerIdx === s.idx}
          />
        ))}

        {/* The can itself — flat sumi outline silhouette */}
        <CanSvg />

        {/* Halo behind winner during reveal */}
        <AnimatePresence>
          {phase === "revealing" && winnerIdx !== null && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
              style={{
                top: -10,
                width: 180,
                height: 180,
                background:
                  "radial-gradient(circle, rgba(232,185,74,0.35) 0%, rgba(232,185,74,0) 65%)",
                filter: "blur(4px)",
                zIndex: 0,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Flat bamboo can — silhouette + 2 node hairlines + dark mouth.
 * No gradients, no glaze. Reads as "ink-printed can" not "3D prop".
 */
function CanSvg() {
  return (
    <svg
      viewBox="0 0 200 280"
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ width: 168, height: 240, zIndex: 2 }}
      aria-hidden
    >
      {/* Ground hairline */}
      <line
        x1="20" y1="230" x2="180" y2="230"
        stroke="#1C1815" strokeWidth="0.8" opacity="0.4"
      />
      {/* Body — flat paper fill + sumi outline. Slight taper. */}
      <path
        d="M 24 50 Q 100 42, 176 50 L 168 226 Q 100 234, 32 226 Z"
        fill="#E2D6B8"
      />
      <path
        d="M 24 50 Q 100 42, 176 50 L 168 226 Q 100 234, 32 226 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Two bamboo node hairlines */}
      {[112, 178].map((y) => (
        <line
          key={y}
          x1="30" y1={y} x2="170" y2={y}
          stroke="#1C1815" strokeWidth="0.7" opacity="0.4"
        />
      ))}
      {/* Mouth — dark flat ellipse + sumi rim */}
      <ellipse cx="100" cy="50" rx="76" ry="11" fill="#1C1815" opacity="0.85" />
      <ellipse
        cx="100" cy="50" rx="76" ry="11"
        fill="none" stroke="#1C1815" strokeWidth="1.5"
      />
      {/* 籤 calligrapher's mark on lower-right */}
      <text
        x="158"
        y="216"
        fontFamily='"Shippori Mincho", serif'
        fontSize="10"
        fontWeight="500"
        fill="#1C1815"
        opacity="0.55"
      >
        籤
      </text>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Single flat omikuji stick — wheat rectangle + dusty-shu cap + 朱 dot
 * at the very top. Per-stick variants for anticipation/shake/reveal.
 */
const Stick = memo(function Stick({
  idx,
  restRot,
  label,
  phase,
  isWinner,
}: {
  idx: number;
  restRot: number;
  label: string;
  phase: StageProps["phase"];
  isWinner: boolean;
}) {
  const variants: Variants = {
    ready: {
      y: 0,
      x: 0,
      opacity: 1,
      rotate: restRot,
      scale: 1,
      transition: { type: "spring", stiffness: 220, damping: 18 },
    },
    shuffling: {
      // Compound jitter on top of the can's macro shake
      rotate: [restRot - 4, restRot + 4, restRot - 3, restRot + 2, restRot],
      x: [0, -1, 1, -1, 0],
      y: [0, -1, 1, 0, 0],
      transition: { duration: SHAKE_MS / 1000, ease: "easeInOut" },
    },
    settled: {
      x: 0,
      y: 0,
      rotate: restRot,
      transition: { duration: SETTLED_MS / 1000 },
    },
    revealing: isWinner
      ? {
          y: [0, 4, -130, -120],
          rotate: [restRot, restRot * 0.4, 0, 0],
          scale: [1, 0.98, 1.1, 1.06],
          transition: {
            duration: REVEAL_MS / 1000,
            times: [0, 0.15, 0.7, 1],
            ease: [0.22, 1, 0.36, 1],
          },
        }
      : {
          y: 4,
          rotate: restRot,
          opacity: 0.18,
          transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] },
        },
  };

  return (
    <motion.span
      className="absolute left-1/2 transform-gpu"
      style={{
        width: 14,
        height: 140,
        bottom: 198,
        marginLeft: -7,
        transformOrigin: "bottom center",
        zIndex: isWinner && phase === "revealing" ? 5 : 1,
        willChange: "transform",
      }}
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      variants={variants}
      animate={phase}
    >
      <svg
        viewBox="0 0 14 140"
        className="block h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Body — flat wheat rectangle + sumi outline */}
        <rect
          x="0.7" y="6" width="12.6" height="132"
          rx="1.2" ry="1.2"
          fill="#E6D6B0"
          stroke="#1C1815"
          strokeWidth="0.6"
        />
        {/* Cap — dusty-shu band */}
        <rect x="0.7" y="6" width="12.6" height="6" fill="#C9817F" />
        <line
          x1="0.7" y1="12" x2="13.3" y2="12"
          stroke="#1C1815" strokeWidth="0.5"
        />
        {/* 朱 dot at the very tip */}
        <circle cx="7" cy="9" r="1.2" fill="#8B2515" />
        {/* Kanji label */}
        <text
          x="7"
          y="24"
          textAnchor="middle"
          fontFamily='"Shippori Mincho", serif'
          fontSize="8"
          fontWeight="700"
          fill="#1C1815"
        >
          {label}
        </text>
      </svg>
    </motion.span>
  );
});
