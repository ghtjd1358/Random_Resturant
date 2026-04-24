"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { PickCard } from "@/components/home/PickCard";
import { Mascot } from "@/components/common/Mascot";
import type { PlaceLite } from "@/lib/places/types";

/**
 * 三つ椀 (mitsu-wan) — 3-bowl shell game ("야바위") variant of the picker.
 *
 * Replaces the omikuji can-and-sticks ceremony with the cleaner shell-game
 * metaphor. Three covered tea bowls shuffle positions; one hides a 朱 mark
 * (the chosen place); user taps to stop; the marked bowl lifts to reveal.
 *
 * Why this works better than the kuji can:
 *   - Three identical objects shuffling reads as "shell game" instantly,
 *     no cultural context needed
 *   - Visual complexity is ~⅓ of the can+sticks composition, so the
 *     premium polish (gradient bowls, soft shadows, lift reveal) doesn't
 *     fight the editorial palette
 *   - The shuffle motion is satisfying in itself — small intentional
 *     swaps with arc paths, not random shake
 *
 * Phases:
 *   ready    → bowls drop in, mascot watching; user taps to start
 *   shuffling → bowls swap positions in 4 stages with arc trajectories
 *   settled   → 200ms breathing pause before reveal (anticipation)
 *   revealing → marked bowl lifts; 朱 mark glows underneath
 *   revealed  → result screen with PickCard
 */

const SHUFFLE_MS = 1900;
const SETTLED_PAUSE_MS = 280;
const REVEAL_MS = 900;

// 3-bowl version — shell game tradition. We always render 3 visually
// regardless of how many candidates were drawn (extra picks still appear
// in the "나머지 후보" list at reveal time).
const NUM_BOWLS = 3;

// Predefined swap sequence — 4 swaps that thoroughly mix the 3 slots.
// Each entry is a pair (a, b) meaning: bowls currently at slot a and slot b
// swap. Using a fixed sequence (not random) keeps the timing predictable
// and the trajectories choreographed.
const SWAP_SEQUENCE: Array<[number, number]> = [
  [0, 1], // first swap: left ↔ middle
  [1, 2], // second: middle ↔ right
  [0, 2], // third: left ↔ right (longest arc)
  [0, 1], // fourth: left ↔ middle
];

// Slot positions in pixels (relative to center). 3 slots evenly spaced.
const SLOT_WIDTH = 92;
const SLOT_X = [-SLOT_WIDTH, 0, SLOT_WIDTH] as const;

interface YabawiModalProps {
  picks: PlaceLite[];
  onClose: () => void;
}

type Phase = "ready" | "shuffling" | "settled" | "revealing" | "revealed";

export function YabawiModal({ picks, onClose }: YabawiModalProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);

  // Compute each bowl's slot trajectory through the swap sequence —
  // memo'd because it only depends on NUM_BOWLS and the static sequence.
  const slotTrajectory = useMemo(() => buildTrajectory(NUM_BOWLS), []);

  // shuffling → settled → revealing
  useEffect(() => {
    if (phase !== "shuffling") return;
    // Pick winner from the picks the user actually drew (cap at NUM_BOWLS).
    const idx = Math.floor(Math.random() * Math.min(picks.length, NUM_BOWLS));
    setWinnerIdx(idx);
    const t = window.setTimeout(() => {
      setPhase("settled");
      haptic.tap();
    }, SHUFFLE_MS);
    return () => window.clearTimeout(t);
  }, [phase, picks]);

  useEffect(() => {
    if (phase !== "settled") return;
    const t = window.setTimeout(() => setPhase("revealing"), SETTLED_PAUSE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing" || winnerIdx === null) return;
    const t = window.setTimeout(() => {
      setPhase("revealed");
      // Map winnerIdx back into the picks array (winnerIdx is bounded by
      // min(picks.length, NUM_BOWLS) so this is always safe).
      setCurrentPick(picks[winnerIdx]);
      haptic.positive();
    }, REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [phase, picks, winnerIdx, setCurrentPick]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleStart = () => {
    if (phase !== "ready") return;
    haptic.rollStart();
    setPhase("shuffling");
  };

  const handleClose = () => {
    haptic.tap();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="야바위"
      className="fixed inset-0 z-[80] flex flex-col bg-paper"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mincho text-[15px] font-medium text-sumi-ink">
            椀
          </span>
          <span className="font-mincho text-[12px] font-medium text-sumi-mute">
            야바위
          </span>
          <span className="font-mincho text-[11px] num-tabular text-sumi-fade">
            {Math.min(picks.length, NUM_BOWLS)}그릇
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="닫기"
          className="rounded-sm p-1 text-sumi-fade transition-colors hover:text-sumi-ink"
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Body — phase swap interpolated via AnimatePresence */}
      <div className="relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase !== "revealed" ? (
            <motion.div
              key="stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Stage
                phase={phase}
                winnerIdx={winnerIdx}
                slotTrajectory={slotTrajectory}
                onStart={handleStart}
              />
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <RevealedView picks={picks} winnerIdx={winnerIdx ?? 0} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Pre-reveal stage: headline + 3 bowls + watermark mascot + vignette.
 * Bowls drive themselves from the slotTrajectory + phase props.
 */
function Stage({
  phase,
  winnerIdx,
  slotTrajectory,
  onStart,
}: {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  slotTrajectory: number[][];
  onStart: () => void;
}) {
  const headlineCopy =
    phase === "ready"
      ? { jp: "選べ", kr: "그릇을 탭해서 셔플 시작" }
      : phase === "shuffling"
        ? { jp: "混", kr: "셔플 중 …" }
        : phase === "settled"
          ? { jp: "止", kr: "어디일까요" }
          : { jp: "出", kr: "한 그릇이 들립니다" };

  return (
    <div className="relative flex h-full flex-col items-center justify-between px-5 py-6">
      <Vignette intensity={phase === "revealing" ? 0.5 : 0.25} />
      <AshLayer />

      {/* Headline */}
      <div className="z-10 flex h-[110px] flex-col items-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <motion.p
              className="font-mincho text-shu"
              style={{
                fontSize: "clamp(40px, 11vmin, 64px)",
                fontWeight: 600,
                lineHeight: 1,
              }}
              animate={
                phase === "shuffling"
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={
                phase === "shuffling"
                  ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 260, damping: 18 }
              }
            >
              {headlineCopy.jp}
            </motion.p>
            <p className="font-mincho mt-2 text-[12px] tracking-tight text-sumi-mute break-keep">
              {headlineCopy.kr}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bowl stage — tappable when ready */}
      <button
        type="button"
        onClick={onStart}
        disabled={phase !== "ready"}
        aria-label="야바위 시작"
        className="no-select relative z-10 flex flex-col items-center"
      >
        {/* Meditate-giraffe watermark — silent witness behind the table */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0.1, zIndex: 0 }}
        >
          <Mascot variant="meditate" px={300} />
        </span>

        {/* Wooden table line — gives the bowls something to sit on */}
        <div
          aria-hidden
          className="absolute"
          style={{
            bottom: 38,
            left: -SLOT_WIDTH * 1.7,
            right: -SLOT_WIDTH * 1.7,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(28,24,21,0.25) 20%, rgba(28,24,21,0.25) 80%, transparent)",
          }}
        />

        {/* Bowl row container */}
        <div
          className="relative flex items-end justify-center"
          style={{ width: SLOT_WIDTH * 3 + 60, height: 320 }}
        >
          {/* The 朱 reveal mark — sits at the WINNER's current slot.
              Hidden until revealing; then it glows up as the winning
              bowl lifts off. */}
          {winnerIdx !== null && (
            <RevealMark
              x={
                phase === "shuffling"
                  ? SLOT_X[slotTrajectory[winnerIdx][SWAP_SEQUENCE.length]]
                  : SLOT_X[slotTrajectory[winnerIdx][SWAP_SEQUENCE.length]]
              }
              visible={phase === "revealing"}
            />
          )}

          {Array.from({ length: NUM_BOWLS }).map((_, idx) => {
            const trajectory = slotTrajectory[idx];
            const isWinner = winnerIdx === idx;
            return (
              <Bowl
                key={idx}
                idx={idx}
                trajectory={trajectory}
                phase={phase}
                isWinner={isWinner}
              />
            );
          })}
        </div>

        <p className="font-mincho mt-4 text-[11px] tracking-[0.3em] text-sumi-fade">
          {phase === "ready" ? "TAP" : "─"}
        </p>
      </button>

      <span aria-hidden />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Single tea bowl — premium SVG with 2-stop paper body, sumi outline, and
 * a soft contact shadow. Uses the slotTrajectory to drive x position
 * across the swap sequence; pairs of bowls travel arcs (one over, one
 * under) so they read as physically swapping rather than teleporting.
 */
const Bowl = memo(function Bowl({
  idx,
  trajectory,
  phase,
  isWinner,
}: {
  idx: number;
  trajectory: number[];
  phase: "ready" | "shuffling" | "settled" | "revealing";
  isWinner: boolean;
}) {
  // Compose x and y keyframes for the shuffle. Each swap takes ~SHUFFLE_MS
  // / SWAP_SEQUENCE.length time. y arcs go up for "front" bowls and down
  // for "back" bowls so they cross without overlap (alternates by step).
  const variants: Variants = useMemo(() => {
    const xKeyframes = trajectory.map((slot) => SLOT_X[slot]);
    // Arc heights — alternate sign per swap step so half the bowls go
    // over and half under, giving the visual cross-over of a real shell
    // shuffle. The bowl's idx % 2 sets which half it's in.
    const yKeyframes: number[] = [0];
    for (let step = 0; step < SWAP_SEQUENCE.length; step++) {
      const goesOver =
        idx === SWAP_SEQUENCE[step][0] === (step % 2 === 0);
      yKeyframes.push(goesOver ? -28 : 14, 0);
    }
    // Match xKeyframes length to yKeyframes by inserting midpoints
    const xExpanded: number[] = [xKeyframes[0]];
    for (let step = 0; step < SWAP_SEQUENCE.length; step++) {
      const start = xKeyframes[step];
      const end = xKeyframes[step + 1];
      xExpanded.push((start + end) / 2, end);
    }

    return {
      ready: {
        x: SLOT_X[idx],
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 240, damping: 22, delay: idx * 0.08 },
      },
      shuffling: {
        x: xExpanded,
        y: yKeyframes,
        rotate: 0,
        transition: {
          duration: SHUFFLE_MS / 1000,
          ease: [0.5, 0, 0.5, 1],
          times: stepsToTimes(yKeyframes.length),
        },
      },
      settled: {
        x: SLOT_X[trajectory[trajectory.length - 1]],
        y: [0, -2, 0],
        rotate: 0,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      },
      revealing: isWinner
        ? {
            x: SLOT_X[trajectory[trajectory.length - 1]],
            y: -90,
            rotate: -8,
            transition: { type: "spring", stiffness: 200, damping: 16 },
          }
        : {
            x: SLOT_X[trajectory[trajectory.length - 1]],
            y: 0,
            opacity: 0.5,
            transition: { duration: 0.4 },
          },
    };
  }, [trajectory, idx, isWinner]);

  return (
    <motion.span
      className="absolute bottom-12 left-1/2 transform-gpu"
      style={{
        marginLeft: -36,
        zIndex: phase === "revealing" && isWinner ? 5 : idx + 1,
        willChange: "transform",
      }}
      initial={{ y: -60, opacity: 0, x: SLOT_X[idx] }}
      variants={variants}
      animate={phase}
    >
      <BowlSvg />
    </motion.span>
  );
});

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Tea bowl SVG — chawan-style upside-down cup. Paper-tan body with sumi
 * outline, subtle inner shading at the rim, and a soft ground shadow.
 */
function BowlSvg() {
  return (
    <svg viewBox="0 0 72 72" width={72} height={72} aria-hidden>
      <defs>
        {/* Body — 4-stop with warmer left side (light source upper-left) */}
        <linearGradient id="bowl-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C9BCA0" />
          <stop offset="35%"  stopColor="#E2D6B8" />
          <stop offset="70%"  stopColor="#D9CCAE" />
          <stop offset="100%" stopColor="#B8AB8E" />
        </linearGradient>
        {/* Bottom shadow inside the rim — gives the cup interior depth */}
        <linearGradient id="bowl-rim-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1815" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1C1815" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ground contact shadow */}
      <ellipse
        cx="36" cy="62" rx="28" ry="2.5"
        fill="#1C1815" opacity="0.18"
        style={{ filter: "blur(2px)" }}
      />

      {/* Bowl body — dome shape (upside-down cup) */}
      <path
        d="M 8 58 Q 8 12, 36 12 Q 64 12, 64 58 L 60 60 L 12 60 Z"
        fill="url(#bowl-body)"
      />
      <path
        d="M 8 58 Q 8 12, 36 12 Q 64 12, 64 58 L 60 60 L 12 60 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Top highlight catches the light */}
      <path
        d="M 14 24 Q 36 14, 58 24"
        fill="none"
        stroke="#F4ECD2"
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Inner rim shading near the bottom (the open mouth, facing down) */}
      <ellipse cx="36" cy="59" rx="26" ry="3" fill="url(#bowl-rim-shade)" />

      {/* Sumi rim line — sharp underside */}
      <line x1="10" y1="59" x2="62" y2="59" stroke="#1C1815" strokeWidth="1.3" />

      {/* Tiny calligrapher's mark — 運 (fortune) on the lower-right side */}
      <text
        x="50"
        y="50"
        fontFamily='"Shippori Mincho", serif'
        fontSize="10"
        fontWeight="500"
        fill="#1C1815"
        opacity="0.6"
      >
        運
      </text>
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * The 朱 reveal mark — small dot that sits on the table where the
 * winning bowl ends up. Glows up as the bowl lifts off.
 */
function RevealMark({ x, visible }: { x: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: 24,
            left: "50%",
            marginLeft: x - 12,
            width: 24,
            height: 24,
            zIndex: 0,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Halo */}
          <span
            className="absolute inset-0 -m-3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,185,74,0.5) 0%, rgba(232,185,74,0) 70%)",
              filter: "blur(2px)",
            }}
          />
          {/* Dot */}
          <span
            className="absolute inset-0 m-1.5 rounded-full bg-shu"
            style={{ boxShadow: "0 0 12px rgba(179,50,29,0.6)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Vignette({ intensity }: { intensity: number }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      animate={{ opacity: intensity }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 35%, rgba(28,24,21,0.3) 100%)",
      }}
    />
  );
}

/* ───────────────────────────────────────────────────────────────────── */

const ASH = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: 10 + ((i * 17) % 78),
  size: 3 + (i % 3),
  delay: (i * 0.5) % 3,
  duration: 4 + (i % 3),
  ashX: ((i * 19) % 30) - 15,
  ashRot: 90 + (i * 47) % 180,
}));

function AshLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {ASH.map((a) => (
        <span
          key={a.id}
          className="absolute bottom-10 rounded-full bg-sumi-ink/40"
          style={
            {
              width: a.size,
              height: a.size,
              left: `${a.left}%`,
              "--ash-x": `${a.ashX}px`,
              "--ash-rot": `${a.ashRot}deg`,
              animation: `kuji-ash-drift ${a.duration}s ease-out ${a.delay}s infinite`,
              opacity: 0,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function RevealedView({
  picks,
  winnerIdx,
}: {
  picks: PlaceLite[];
  winnerIdx: number;
}) {
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const currentPickId = useSessionStore((s) => s.currentPick?.id);

  return (
    <div className="px-5 pt-6 pb-8">
      <motion.div
        className="flex flex-col items-center text-center"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.1 },
          },
        }}
      >
        <motion.span
          aria-hidden
          style={{ transformOrigin: "bottom center" }}
          variants={{
            hidden: { opacity: 0, y: -16, scale: 0.7 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 200, damping: 16 },
            },
          }}
        >
          <Mascot variant="scroll-fortune" size="lg" decorative={false} />
        </motion.span>
        <motion.p
          className="font-mincho mt-1 text-[12px] tracking-[0.3em] text-sumi-fade"
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          결과
        </motion.p>
        <motion.p
          className="font-mincho mt-1 text-shu"
          style={{ fontSize: 38, fontWeight: 600, lineHeight: 1 }}
          variants={{
            hidden: { opacity: 0, scale: 0.7 },
            show: {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 240, damping: 14 },
            },
          }}
        >
          大吉
        </motion.p>
        <motion.p
          className="font-mincho mt-2 text-[12px] text-sumi-mute break-keep"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.5 } },
          }}
        >
          오늘 한 집은 이쪽으로.
        </motion.p>
      </motion.div>

      <div className="mt-6">
        <PickCard />
      </div>

      {picks.length > 1 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between border-b border-hairline-soft pb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mincho text-[14px] font-medium text-sumi-ink">
                椀
              </span>
              <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
                나머지 후보
              </span>
            </div>
            <span className="font-mincho text-[11px] num-tabular text-sumi-fade">
              모두 {picks.length}곳
            </span>
          </div>

          <ul className="flex flex-col">
            {picks.map((p, i) => {
              const isWinner = i === winnerIdx;
              const isCurrent = p.id === currentPickId;
              return (
                <li
                  key={p.id}
                  className="border-b border-hairline-soft last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPick(p)}
                    className="no-select flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-sumi-ink/5"
                  >
                    <span
                      className={cn(
                        "font-mincho mt-0.5 w-[20px] shrink-0 text-[12px] num-tabular",
                        isCurrent ? "text-sumi-ink" : "text-sumi-fade",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-mincho truncate text-[14px] font-medium tracking-tight",
                          isCurrent ? "text-sumi-ink" : "text-sumi-mute",
                        )}
                      >
                        {p.name}
                      </p>
                      {(p.rating !== undefined ||
                        p.distanceMeters !== undefined) && (
                        <p className="mt-0.5 text-[11px] num-tabular text-sumi-fade">
                          {p.rating !== undefined && (
                            <span>
                              <span className="text-shu">★</span>{" "}
                              {p.rating.toFixed(1)}
                            </span>
                          )}
                          {p.distanceMeters !== undefined && (
                            <>
                              <span className="mx-1.5">·</span>
                              <span>
                                도보{" "}
                                {Math.max(
                                  1,
                                  Math.round(p.distanceMeters / 80),
                                )}
                                분
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    {isWinner && (
                      <span
                        className="font-mincho shrink-0 text-[11px] tracking-tight text-shu"
                        aria-label="뽑힌 곳"
                      >
                        뽑힘
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="font-mincho mt-3 text-center text-[11px] text-sumi-fade break-keep">
            항목을 누르면 위 카드가 그쪽으로 바뀝니다.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */
/* Helpers                                                              */
/* ───────────────────────────────────────────────────────────────────── */

/**
 * For each bowl, build the trajectory of slot indices it visits across
 * the swap sequence. Result: trajectory[bowl] = [startSlot, ...afterEachSwap]
 * with length = SWAP_SEQUENCE.length + 1.
 */
function buildTrajectory(numBowls: number): number[][] {
  const traj: number[][] = Array.from({ length: numBowls }, (_, i) => [i]);
  // current slot map: slotOf[bowl] = current slot
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

/**
 * Even time-distributed array for motion's `times` prop. Spreads N
 * keyframes uniformly between 0 and 1.
 */
function stepsToTimes(n: number): number[] {
  if (n <= 1) return [0];
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}
