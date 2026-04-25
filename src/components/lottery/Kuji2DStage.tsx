"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Kuji 2D Stage — flat woodblock omikuji can with sticks.
 *
 * Rebuilt with DIRECT `animate` prop pattern (not variants) so the
 * shake motion always plays. Larger composition (200×320 → fills the
 * available canvas) so motion has visible weight.
 *
 * Composition: can sits LOWER on canvas, sticks visibly emerge from the
 * mouth ABOVE. Shake = whole-can rotation + horizontal shimmy. Reveal =
 * winner stick rises straight up clear of the can rim with rotation
 * straightening to 0.
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
  // Pre-compute the can shake animate config once per phase.
  const canAnimate = useMemo(() => {
    if (phase === "shuffling") {
      return {
        rotate: [0, -3, -1, -10, 8, -6, 4, -2, 0, 1.5, -0.5, 0],
        x: [0, -2, 1, -4, 3, -2, 1, 0, 0, 0.5, 0, 0],
        y: [0, -2, 0, -3, 0, -2, 0, 0, 0, 0, 0, 0],
        transition: {
          duration: SHAKE_MS / 1000,
          times: [0, 0.05, 0.1, 0.2, 0.32, 0.45, 0.58, 0.7, 0.82, 0.88, 0.94, 1],
          ease: "easeInOut" as const,
        },
      };
    }
    if (phase === "settled") {
      return {
        rotate: [0, -1, 0],
        x: 0,
        y: 0,
        transition: { duration: SETTLED_MS / 1000, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };
    }
    if (phase === "revealing") {
      return {
        rotate: [-2, 0],
        x: 0,
        y: 0,
        transition: { duration: 0.5 },
      };
    }
    return { rotate: 0, x: 0, y: 0 };
  }, [phase]);

  const sticks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        idx: i,
        restRot: Number(((i - (count - 1) / 2) * 5).toFixed(1)),
        label: STICK_LABELS[i % STICK_LABELS.length],
      })),
    [count],
  );

  return (
    <button
      type="button"
      onClick={phase === "ready" ? onStart : undefined}
      disabled={phase !== "ready"}
      aria-label="제비뽑기 시작"
      className="no-select relative h-full w-full"
    >
      {/* The whole can+sticks group — shake transforms apply here */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 transform-gpu"
        style={{
          bottom: 20,
          width: 220,
          height: 320,
          transformOrigin: "50% 90%",
          willChange: "transform",
        }}
        animate={canAnimate}
      >
        {/* Sticks render BEHIND can front in z-order, but their tops
            visibly stand above the can rim */}
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

        {/* The can */}
        <CanSvg />

        {/* Halo behind winner during reveal */}
        <AnimatePresence>
          {phase === "revealing" && winnerIdx !== null && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
              style={{
                top: -20,
                width: 200,
                height: 200,
                background:
                  "radial-gradient(circle, rgba(232,185,74,0.4) 0%, rgba(232,185,74,0) 65%)",
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
 * Flat omikuji can — silhouette + 2 bamboo node hairlines + dark mouth.
 * Bigger than v1 (220×280 viewbox) for more presence on the canvas.
 */
function CanSvg() {
  return (
    <svg
      viewBox="0 0 220 280"
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ width: 200, height: 256, zIndex: 2 }}
      aria-hidden
    >
      {/* Ground hairline */}
      <line
        x1="20" y1="262" x2="200" y2="262"
        stroke="#1C1815" strokeWidth="0.9" opacity="0.4"
      />
      {/* Body — more characterful taper: narrower at top, wider mid-low */}
      <path
        d="M 28 56 Q 110 46, 192 56 L 184 256 Q 110 264, 36 256 Z"
        fill="#E2D6B8"
      />
      <path
        d="M 28 56 Q 110 46, 192 56 L 184 256 Q 110 264, 36 256 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Bamboo node hairlines — three rings for proper bamboo cue */}
      {[120, 175, 230].map((y) => (
        <line
          key={y}
          x1="34" y1={y} x2="186" y2={y}
          stroke="#1C1815" strokeWidth="0.7" opacity="0.4"
        />
      ))}
      {/* Mouth — flat dark ellipse + sumi rim */}
      <ellipse cx="110" cy="56" rx="82" ry="11" fill="#1C1815" opacity="0.88" />
      <ellipse
        cx="110" cy="56" rx="82" ry="11"
        fill="none" stroke="#1C1815" strokeWidth="1.6"
      />
      {/* Subtle 籤 mark on lower-right body */}
      <text
        x="170"
        y="240"
        fontFamily='"Shippori Mincho", serif'
        fontSize="11"
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

interface StickProps {
  idx: number;
  restRot: number;
  label: string;
  phase: StageProps["phase"];
  isWinner: boolean;
}

const Stick = memo(function Stick({ idx, restRot, label, phase, isWinner }: StickProps) {
  const animateConfig = useMemo(() => {
    if (phase === "ready") {
      return {
        x: 0,
        y: 0,
        rotate: restRot,
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring" as const,
          stiffness: 220,
          damping: 18,
          delay: idx * 0.06,
        },
      };
    }

    if (phase === "shuffling") {
      // Compound jitter on top of the parent can's macro shake
      return {
        rotate: [restRot - 5, restRot + 5, restRot - 4, restRot + 3, restRot - 1, restRot],
        x: [0, -1.5, 1.5, -1, 1, 0],
        y: [0, -2, 1, -1, 0, 0],
        opacity: 1,
        transition: {
          duration: SHAKE_MS / 1000,
          ease: "easeInOut" as const,
        },
      };
    }

    if (phase === "settled") {
      return {
        x: 0,
        y: 0,
        rotate: restRot,
        opacity: 1,
        transition: { duration: SETTLED_MS / 1000 },
      };
    }

    // revealing
    if (isWinner) {
      return {
        y: [0, 6, -160, -150],
        rotate: [restRot, restRot * 0.5, 0, 0],
        scale: [1, 0.98, 1.12, 1.08],
        opacity: 1,
        transition: {
          duration: REVEAL_MS / 1000,
          times: [0, 0.15, 0.7, 1],
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
      };
    }
    return {
      y: 4,
      rotate: restRot,
      opacity: 0.18,
      scale: 0.95,
      transition: { duration: 0.5 },
    };
  }, [phase, restRot, isWinner, idx]);

  return (
    <motion.span
      className="absolute left-1/2 transform-gpu"
      style={{
        width: 16,
        height: 160,
        bottom: 220,
        marginLeft: -8,
        transformOrigin: "bottom center",
        zIndex: isWinner && phase === "revealing" ? 5 : 1,
        willChange: "transform",
      }}
      initial={{ y: -50, opacity: 0, rotate: 0 }}
      animate={animateConfig}
    >
      <svg
        viewBox="0 0 16 160"
        className="block h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Body — flat wheat rectangle + sumi outline */}
        <rect
          x="1" y="6" width="14" height="152"
          rx="1.5" ry="1.5"
          fill="#E6D6B0"
          stroke="#1C1815"
          strokeWidth="0.7"
        />
        {/* Cap — dusty-shu band */}
        <rect x="1" y="6" width="14" height="7" fill="#C9817F" />
        <line
          x1="1" y1="13" x2="15" y2="13"
          stroke="#1C1815" strokeWidth="0.6"
        />
        {/* 朱 dot at the very tip */}
        <circle cx="8" cy="9.5" r="1.4" fill="#8B2515" />
        {/* Kanji label */}
        <text
          x="8"
          y="28"
          textAnchor="middle"
          fontFamily='"Shippori Mincho", serif'
          fontSize="9"
          fontWeight="700"
          fill="#1C1815"
        >
          {label}
        </text>
      </svg>
    </motion.span>
  );
});
