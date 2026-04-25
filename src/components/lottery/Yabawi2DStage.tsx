"use client";

import { memo, useMemo } from "react";
import { motion, type Variants } from "motion/react";

/**
 * Yabawi 2D Stage — 3-bowl shell game in a flat woodblock-print style.
 *
 * Replaces the R3F 3D version after we realized the editorial Japanese
 * paper-and-ink palette fights with photorealistic 3D rendering. Pure flat
 * silhouettes + sumi-ink outlines + motion-driven polish = on-brand.
 *
 * Visual constraints (intentionally restrictive):
 *   - NO gradients (flat fills only)
 *   - NO drop shadows on bowls (one ground hairline per bowl, that's it)
 *   - NO glaze / specular fakery
 *   - Each bowl = paper fill + 1.5px sumi outline + 朱 dot at crown
 *   - Motion (spring physics + arc paths) carries all the polish
 */

const SHUFFLE_MS = 2400;
const SETTLED_MS = 320;
const REVEAL_MS = 1000;

const SLOT_WIDTH = 96;
const SLOT_X = [-SLOT_WIDTH, 0, SLOT_WIDTH] as const;

// Predefined swap sequence — 4 swaps for thorough mixing.
const SWAP_SEQUENCE: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [0, 2],
  [0, 1],
];

interface StageProps {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  onStart: () => void;
}

export function Yabawi2DStage({ phase, winnerIdx, onStart }: StageProps) {
  const slotTrajectory = useMemo(() => buildTrajectory(3), []);

  return (
    <button
      type="button"
      onClick={phase === "ready" ? onStart : undefined}
      disabled={phase !== "ready"}
      aria-label="야바위 시작"
      className="no-select relative h-full w-full"
    >
      {/* Surface hairline — single line is all the "table" we need */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 60,
          width: SLOT_WIDTH * 3.6,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(28,24,21,0.35) 18%, rgba(28,24,21,0.35) 82%, transparent)",
        }}
      />

      {/* Bowls */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 60, width: SLOT_WIDTH * 3 + 60, height: 200 }}
      >
        {[0, 1, 2].map((idx) => (
          <Bowl
            key={idx}
            idx={idx}
            trajectory={slotTrajectory[idx]}
            phase={phase}
            isWinner={winnerIdx === idx}
          />
        ))}
      </div>
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

const Bowl = memo(function Bowl({
  idx,
  trajectory,
  phase,
  isWinner,
}: {
  idx: number;
  trajectory: number[];
  phase: StageProps["phase"];
  isWinner: boolean;
}) {
  const variants: Variants = useMemo(() => {
    // Build x/y/rotate keyframes from the trajectory (anticipation +
    // arc + landing per swap, alternating over/under for cross-over).
    const xFrames: number[] = [SLOT_X[trajectory[0]]];
    const yFrames: number[] = [0];
    const rotFrames: number[] = [0];

    for (let step = 0; step < SWAP_SEQUENCE.length; step++) {
      const startX = SLOT_X[trajectory[step]];
      const endX = SLOT_X[trajectory[step + 1]];
      const direction = endX > startX ? 1 : endX < startX ? -1 : 0;
      const goesOver = idx === SWAP_SEQUENCE[step][0] === (step % 2 === 0);

      // Anticipation lift
      xFrames.push(startX);
      yFrames.push(-3);
      rotFrames.push(0);

      // Arc apex
      xFrames.push((startX + endX) / 2);
      yFrames.push(goesOver ? -52 : 18);
      rotFrames.push(direction * (goesOver ? 8 : 4));

      // Landing
      xFrames.push(endX);
      yFrames.push(0);
      rotFrames.push(direction * -2);
    }

    const finalX = SLOT_X[trajectory[trajectory.length - 1]];

    return {
      ready: {
        x: SLOT_X[idx],
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 220, damping: 22, delay: idx * 0.07 },
      },
      shuffling: {
        x: xFrames,
        y: yFrames,
        rotate: rotFrames,
        transition: {
          duration: SHUFFLE_MS / 1000,
          ease: [0.45, 0, 0.55, 1],
          times: evenTimes(yFrames.length),
        },
      },
      settled: {
        x: finalX,
        y: [0, -2, 0],
        rotate: 0,
        transition: { duration: SETTLED_MS / 1000, ease: [0.22, 1, 0.36, 1] },
      },
      revealing: isWinner
        ? {
            x: finalX,
            y: [0, 4, -90, -82],
            rotate: [0, 0, -10, -8],
            transition: {
              duration: REVEAL_MS / 1000,
              times: [0, 0.12, 0.7, 1],
              ease: [0.22, 1, 0.36, 1],
            },
          }
        : {
            x: finalX,
            y: 0,
            opacity: 0.3,
            transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] },
          },
    };
  }, [trajectory, idx, isWinner]);

  return (
    <motion.span
      className="absolute left-1/2 -translate-x-1/2 transform-gpu"
      style={{
        bottom: 0,
        marginLeft: -36,
        zIndex: phase === "revealing" && isWinner ? 5 : idx + 1,
        willChange: "transform",
      }}
      initial={{ y: -40, opacity: 0, x: SLOT_X[idx] }}
      variants={variants}
      animate={phase}
    >
      <BowlSvg />
    </motion.span>
  );
});

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Flat sumi tea bowl. Three elements only:
 *   1. Body silhouette (flat paper fill + 1.4px sumi outline)
 *   2. Foot ring hairline (1px sumi)
 *   3. 朱 dot at the top crown (single color accent)
 * No gradients, no highlights, no fake depth.
 */
function BowlSvg() {
  return (
    <svg viewBox="0 0 72 60" width={72} height={60} aria-hidden>
      {/* Body — slightly tapered chawan, flat fill */}
      <path
        d="M 8 50 Q 4 12, 36 8 Q 68 12, 64 50 L 60 52 L 12 52 Z"
        fill="#E2D6B8"
      />
      <path
        d="M 8 50 Q 4 12, 36 8 Q 68 12, 64 50 L 60 52 L 12 52 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Foot ring hairline */}
      <line
        x1="14" y1="52" x2="58" y2="52"
        stroke="#1C1815" strokeWidth="0.8" opacity="0.7"
      />
      {/* 朱 dot at top crown — single accent */}
      <circle cx="36" cy="14" r="2" fill="#B3321D" />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/* Helpers                                                              */
/* ───────────────────────────────────────────────────────────────────── */

function buildTrajectory(numBowls: number): number[][] {
  const traj: number[][] = Array.from({ length: numBowls }, (_, i) => [i]);
  const slotOf = Array.from({ length: numBowls }, (_, i) => i);
  for (const [a, b] of SWAP_SEQUENCE) {
    const bowlAtA = slotOf.findIndex((s) => s === a);
    const bowlAtB = slotOf.findIndex((s) => s === b);
    if (bowlAtA >= 0) slotOf[bowlAtA] = b;
    if (bowlAtB >= 0) slotOf[bowlAtB] = a;
    for (let i = 0; i < numBowls; i++) {
      traj[i].push(slotOf[i]);
    }
  }
  return traj;
}

function evenTimes(n: number): number[] {
  if (n <= 1) return [0];
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}
