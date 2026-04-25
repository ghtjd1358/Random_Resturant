"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";

/**
 * Yabawi 2D Stage — flat woodblock 3-bowl shell game.
 *
 * Rebuilt with DIRECT `animate` prop (not variants). Variant-based
 * keyframe arrays were silently failing to start in some cases — the
 * direct prop pattern is more reliable for phase-driven keyframe
 * animations.
 *
 * Visual: pure flat sumi silhouettes, larger and more characterful than
 * v1. Bowl is 110×95 with a defined rim flare; sumi outline 1.6px;
 * single 朱 dot at crown. NO gradients, NO shadows on bowls.
 */

const SHUFFLE_MS = 2400;
const SETTLED_MS = 320;
const REVEAL_MS = 1000;

const SLOT_WIDTH = 110;
const SLOT_X = [-SLOT_WIDTH, 0, SLOT_WIDTH] as const;

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
      {/* Surface line — single sumi hairline, the entire "table" */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 90,
          width: SLOT_WIDTH * 3.6,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(28,24,21,0.4) 18%, rgba(28,24,21,0.4) 82%, transparent)",
        }}
      />

      {/* Bowls — explicit absolute positions inside the parent button */}
      {[0, 1, 2].map((idx) => (
        <Bowl
          key={idx}
          idx={idx}
          trajectory={slotTrajectory[idx]}
          phase={phase}
          isWinner={winnerIdx === idx}
        />
      ))}
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

interface BowlProps {
  idx: number;
  trajectory: number[];
  phase: StageProps["phase"];
  isWinner: boolean;
}

const Bowl = memo(function Bowl({ idx, trajectory, phase, isWinner }: BowlProps) {
  // Build keyframes for the shuffle ONCE per render (stable per phase).
  const animateConfig = useMemo(() => {
    if (phase === "ready") {
      return {
        x: SLOT_X[idx],
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: {
          type: "spring" as const,
          stiffness: 220,
          damping: 22,
          delay: idx * 0.08,
        },
      };
    }

    if (phase === "shuffling") {
      const xFrames: number[] = [SLOT_X[trajectory[0]]];
      const yFrames: number[] = [0];
      const rotFrames: number[] = [0];

      for (let step = 0; step < SWAP_SEQUENCE.length; step++) {
        const startX = SLOT_X[trajectory[step]];
        const endX = SLOT_X[trajectory[step + 1]];
        const direction = endX > startX ? 1 : endX < startX ? -1 : 0;
        const goesOver = idx === SWAP_SEQUENCE[step][0] === (step % 2 === 0);

        // Anticipation lift before the swap arc
        xFrames.push(startX);
        yFrames.push(-4);
        rotFrames.push(0);

        // Mid-arc apex — "over" bowls go higher; "under" bowls dip down
        xFrames.push((startX + endX) / 2);
        yFrames.push(goesOver ? -65 : 22);
        rotFrames.push(direction * (goesOver ? 10 : 5));

        // Landing
        xFrames.push(endX);
        yFrames.push(0);
        rotFrames.push(direction * -2);
      }

      return {
        x: xFrames,
        y: yFrames,
        rotate: rotFrames,
        opacity: 1,
        transition: {
          duration: SHUFFLE_MS / 1000,
          ease: [0.45, 0, 0.55, 1] as [number, number, number, number],
          times: evenTimes(yFrames.length),
        },
      };
    }

    if (phase === "settled") {
      return {
        x: SLOT_X[trajectory[trajectory.length - 1]],
        y: [0, -3, 0],
        rotate: 0,
        opacity: 1,
        transition: {
          duration: SETTLED_MS / 1000,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
      };
    }

    // revealing
    const finalX = SLOT_X[trajectory[trajectory.length - 1]];
    if (isWinner) {
      return {
        x: finalX,
        y: [0, 5, -100, -90],
        rotate: [0, 1, -12, -10],
        opacity: 1,
        transition: {
          duration: REVEAL_MS / 1000,
          times: [0, 0.12, 0.7, 1],
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
      };
    }
    return {
      x: finalX,
      y: 0,
      rotate: 0,
      opacity: 0.25,
      transition: { duration: 0.5 },
    };
  }, [phase, idx, isWinner, trajectory]);

  return (
    <motion.div
      className="absolute transform-gpu"
      style={{
        bottom: 30,
        left: "50%",
        marginLeft: -55, // half of bowl width (110)
        width: 110,
        height: 95,
        zIndex: phase === "revealing" && isWinner ? 5 : idx + 1,
        willChange: "transform",
        transformOrigin: "50% 75%",
      }}
      initial={{ x: SLOT_X[idx], y: -50, opacity: 0 }}
      animate={animateConfig}
    >
      <BowlSvg />
    </motion.div>
  );
});

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Flat sumi tea bowl — chawan silhouette with rim flare for character.
 * Bigger than v1 (110×95) so the motion has visual weight.
 */
function BowlSvg() {
  return (
    <svg viewBox="0 0 110 95" width={110} height={95} aria-hidden>
      {/* Body — distinctive chawan silhouette: slight rim flare at top,
          tapered toward the foot. Flat paper fill. */}
      <path
        d="M 12 78 Q 6 18, 28 12 L 82 12 Q 104 18, 98 78 L 90 82 L 20 82 Z"
        fill="#E2D6B8"
      />
      <path
        d="M 12 78 Q 6 18, 28 12 L 82 12 Q 104 18, 98 78 L 90 82 L 20 82 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Foot ring — single hairline */}
      <line
        x1="22" y1="82" x2="88" y2="82"
        stroke="#1C1815" strokeWidth="0.9" opacity="0.65"
      />
      {/* Rim — subtle horizontal line at the top edge */}
      <line
        x1="32" y1="14" x2="78" y2="14"
        stroke="#1C1815" strokeWidth="0.7" opacity="0.4"
      />
      {/* 朱 dot at crown — bigger, single color accent */}
      <circle cx="55" cy="22" r="3" fill="#B3321D" />
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
