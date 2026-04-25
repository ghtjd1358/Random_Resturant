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

        {/* Wooden table — three layered hairlines + soft surface tint
            give the suggestion of a tea ceremony tray without painting an
            actual wood texture. */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: 28,
            left: -SLOT_WIDTH * 1.7,
            right: -SLOT_WIDTH * 1.7,
            height: 28,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(122,109,82,0.05) 40%, rgba(122,109,82,0.08) 100%)",
          }}
        />
        {/* Top edge of the surface */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: 56,
            left: -SLOT_WIDTH * 1.7,
            right: -SLOT_WIDTH * 1.7,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(28,24,21,0.32) 18%, rgba(28,24,21,0.32) 82%, transparent)",
          }}
        />
        {/* Subtle grain ridge below */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: 48,
            left: -SLOT_WIDTH * 1.5,
            right: -SLOT_WIDTH * 1.5,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(28,24,21,0.1) 30%, rgba(28,24,21,0.1) 70%, transparent)",
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
  // Compose x/y/rotate keyframes for the shuffle. Each swap = anticipation
  // pre-lift + arc crossing + landing settle. Bowls also rotate slightly in
  // the direction of motion so they read as "rolling" rather than gliding.
  const variants: Variants = useMemo(() => {
    const xKeyframes = trajectory.map((slot) => SLOT_X[slot]);

    const yFrames: number[] = [0]; // start position (resting)
    const xFrames: number[] = [xKeyframes[0]];
    const rotFrames: number[] = [0];

    for (let step = 0; step < SWAP_SEQUENCE.length; step++) {
      const goesOver =
        idx === SWAP_SEQUENCE[step][0] === (step % 2 === 0);

      const startX = xKeyframes[step];
      const endX = xKeyframes[step + 1];
      const direction = endX > startX ? 1 : endX < startX ? -1 : 0;

      // Anticipation tick — bowl lifts slightly before the swap arc
      yFrames.push(-4);
      xFrames.push(startX);
      rotFrames.push(0);

      // Arc apex — bowl is mid-air (over) or mid-dip (under)
      yFrames.push(goesOver ? -42 : 18);
      xFrames.push((startX + endX) / 2);
      // Tilt in direction of motion (rolling cue) — over bowls tip more
      rotFrames.push(direction * (goesOver ? 12 : 6));

      // Landing — bowl returns to rest height at the new slot, slight
      // counter-rotate as it settles
      yFrames.push(0);
      xFrames.push(endX);
      rotFrames.push(direction * -3);
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
        x: xFrames,
        y: yFrames,
        rotate: rotFrames,
        transition: {
          duration: SHUFFLE_MS / 1000,
          ease: [0.45, 0, 0.55, 1], // cubic-bezier closer to cubic, more snappy
          times: stepsToTimes(yFrames.length),
        },
      },
      settled: {
        x: SLOT_X[trajectory[trajectory.length - 1]],
        // Tiny landing bounce — sells weight after the shuffle stops
        y: [0, -3, 0, -1, 0],
        rotate: [0, -1, 0],
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      },
      revealing: isWinner
        ? {
            x: SLOT_X[trajectory[trajectory.length - 1]],
            // 3-stage lift: anticipation dip → big rise → slight tilt back
            y: [0, 6, -130, -125],
            rotate: [0, 2, -18, -15],
            scale: [1, 0.98, 1.05, 1.04],
            transition: {
              duration: REVEAL_MS / 1000,
              times: [0, 0.12, 0.7, 1],
              ease: [0.22, 1, 0.36, 1],
            },
          }
        : {
            x: SLOT_X[trajectory[trajectory.length - 1]],
            y: 0,
            opacity: 0.4,
            scale: 0.95,
            filter: "saturate(0.5) blur(0.4px)",
            transition: { duration: 0.5, ease: [0.4, 0, 0.6, 1] },
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
 * Premium tea bowl SVG — chawan with ceramic glaze, foot ring, and
 * hand-painted 朱 dot. Bigger viewBox (90×80) than v1 for more detail
 * room. Built around a radial gradient that simulates light hitting the
 * upper-left of the glaze, plus a specular highlight arc for the wet
 * ceramic look — this is what separates "shape" from "object".
 */
function BowlSvg() {
  return (
    <svg
      viewBox="0 0 90 80"
      width={84}
      height={75}
      aria-hidden
    >
      <defs>
        {/* Radial glaze — light source upper-left, deepens toward the
            lower-right. Three stops give a soft bell curve falloff that
            reads as "ceramic" not "flat color". */}
        <radialGradient id="bowl-glaze" cx="32%" cy="22%" r="92%">
          <stop offset="0%"   stopColor="#F2E8CD" />
          <stop offset="38%"  stopColor="#DDCFB0" />
          <stop offset="78%"  stopColor="#A89A78" />
          <stop offset="100%" stopColor="#6E624A" />
        </radialGradient>
        {/* Foot ring — slightly darker than body, 2-stop vertical for
            grounded depth */}
        <linearGradient id="bowl-foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7A6D52" />
          <stop offset="100%" stopColor="#3F3829" />
        </linearGradient>
        {/* Inner mouth shadow at the very bottom rim (cup opens
            downward in the upside-down position) */}
        <linearGradient id="bowl-mouth-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1815" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1C1815" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Two-layer ground shadow — sharp tight + diffuse halo. Real
          ceramic on a wood table casts both. */}
      <ellipse
        cx="45" cy="73" rx="32" ry="2.5"
        fill="#1C1815" opacity="0.28"
        style={{ filter: "blur(1.5px)" }}
      />
      <ellipse
        cx="45" cy="76" rx="44" ry="4"
        fill="#1C1815" opacity="0.1"
        style={{ filter: "blur(4px)" }}
      />

      {/* Body — chawan silhouette with subtle taper toward the foot.
          Wider mid-section, narrower at top + bottom = classic tea bowl
          proportion (not a perfect dome). */}
      <path
        d="M 14 66 Q 7 18, 45 12 Q 83 18, 76 66 L 70 68 L 20 68 Z"
        fill="url(#bowl-glaze)"
      />

      {/* Foot ring — small lip the bowl sits on, gives base weight */}
      <ellipse cx="45" cy="68" rx="26" ry="1.8" fill="url(#bowl-foot)" />

      {/* Sumi outline — slightly variable weight at 1.6 for hand-drawn feel */}
      <path
        d="M 14 66 Q 7 18, 45 12 Q 83 18, 76 66 L 70 68 L 20 68 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Specular highlight — small bright arc on the upper-left curve.
          THIS is the detail that turns a flat shape into glazed ceramic.
          White at low opacity, arc shape, soft cap. */}
      <path
        d="M 22 22 Q 30 14, 40 16"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.65"
        strokeLinecap="round"
      />

      {/* Diffuse top highlight — broader, fainter sheen along the upper rim */}
      <path
        d="M 18 30 Q 45 16, 75 30"
        fill="none"
        stroke="#F8EFD2"
        strokeWidth="0.7"
        opacity="0.5"
      />

      {/* Bottom mouth shading — dark fade where the cup opens
          downward (the mouth facing the table) */}
      <ellipse cx="45" cy="67" rx="29" ry="3" fill="url(#bowl-mouth-shade)" />

      {/* Hand-painted 朱 dot at the very top crown — like a kintsugi
          repair mark or a calligrapher's signature dot. Single color
          accent that ties to the rest of the page's 朱 vocabulary
          without shouting. */}
      <circle cx="45" cy="20" r="2.2" fill="#B3321D" opacity="0.9" />
      <circle cx="44.3" cy="19" r="0.9" fill="#FFFFFF" opacity="0.45" />
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
            bottom: 28,
            left: "50%",
            marginLeft: x - 16,
            width: 32,
            height: 32,
            zIndex: 0,
          }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer warm glow — large soft halo, slow pulse for "alive light" */}
          <motion.span
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,185,74,0.55) 0%, rgba(232,185,74,0.18) 35%, rgba(232,185,74,0) 70%)",
              filter: "blur(3px)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Inner shu halo — tighter, deeper red */}
          <span
            className="absolute inset-0 -m-2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(179,50,29,0.55) 0%, rgba(179,50,29,0) 65%)",
              filter: "blur(2px)",
            }}
          />
          {/* Dot — solid 朱 with strong shadow for depth */}
          <span
            className="absolute inset-0 m-2.5 rounded-full bg-shu"
            style={{
              boxShadow:
                "0 0 14px rgba(179,50,29,0.75), 0 2px 4px rgba(28,24,21,0.4)",
            }}
          />
          {/* Tiny specular point on the dot */}
          <span
            className="absolute m-3 rounded-full bg-paper"
            style={{ width: 4, height: 4, opacity: 0.55 }}
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
