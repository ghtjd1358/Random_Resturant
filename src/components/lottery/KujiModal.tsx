"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { PickCard } from "@/components/home/PickCard";
import { Mascot } from "@/components/common/Mascot";
import type { PlaceLite } from "@/lib/places/types";

// Omikuji-style fortune kanji rotated through the sticks. The winner gets
// 大吉 ("great fortune") at reveal time so users learn the pattern.
const STICK_KANJI = ["吉", "中", "末", "小", "凶", "半", "平", "福"];

const SHAKE_MS = 1100;
const DRAWING_MS = 900;

// Deterministic ink splash positions — flicked off the cylinder lip during
// shake. No RNG so render stays pure for React 19. Used by motion.span
// children with stagger for a more natural cascade than per-particle delays.
const SPLASH = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + (i % 3) * 0.3;
  const distance = 90 + ((i * 23) % 70);
  return {
    id: i,
    sx: Math.cos(angle) * distance,
    sy: Math.sin(angle) * distance - 30,
    size: 4 + (i % 4),
  };
});

// Slow ash flakes drifting upward through the whole ceremony. Still
// CSS-driven — they're ambient, infinite, not phase-aware. motion would
// be overkill for a constant background loop.
const ASH = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 13) % 84),
  size: 3 + (i % 3),
  delay: (i * 0.4) % 3,
  duration: 4 + (i % 3),
  ashX: ((i * 17) % 30) - 15,
  ashRot: 90 + (i * 47) % 180,
}));

/* ─── Motion variants ────────────────────────────────────────────────── */

// Cylinder shake — keyframe array driven by motion. The values dampen
// progressively (8 → 6 → 3 → 0) so the shake decays naturally instead of
// stopping abruptly like a CSS animation.
const cylinderVariants: Variants = {
  ready: { rotate: 0, x: 0 },
  shaking: {
    rotate: [0, -8, 7, -5, 4, -2, 0],
    x: [0, -3, 2, -2, 1, 0, 0],
    transition: { duration: 1.1, ease: "easeInOut" },
  },
  drawing: {
    rotate: 0,
    x: 0,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

// Splash group orchestration — staggered emit during shake so droplets
// flick out in waves, not all at once.
const splashGroupVariants: Variants = {
  shaking: {
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
  ready: {},
  drawing: {},
};

const splashVariants: Variants = {
  shaking: (custom: { sx: number; sy: number }) => ({
    x: custom.sx,
    y: custom.sy,
    opacity: [0, 0.7, 0],
    scale: [0.4, 1, 0.9],
    transition: { duration: 1.1, ease: [0.2, 0.7, 0.3, 1] },
  }),
  ready: { x: 0, y: 0, opacity: 0, scale: 0.4 },
  drawing: { opacity: 0 },
};

// Stick group — staggers initial drop-in and shake. Drawing stagger is
// near-zero so winner rises immediately.
const stickGroupVariants: Variants = {
  ready: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  shaking: { transition: { staggerChildren: 0.045 } },
  drawing: { transition: { staggerChildren: 0.02 } },
};

interface KujiModalProps {
  picks: PlaceLite[];
  onClose: () => void;
}

type Phase = "ready" | "shaking" | "drawing" | "revealed";

/**
 * Kuji draw modal. The picks have already been chosen — this just stages
 * the ceremony.
 *
 * Phase machine:
 *   ready    → cylinder + sticks fall in; user taps to shake
 *   shaking  → cylinder + sticks oscillate, ink splashes flick out
 *   drawing  → winner stick rises out of the cylinder; losers fade down
 *   revealed → result screen with PickCard + 나머지 후보 토글
 *
 * The winner index is decided the moment shaking starts so the drawing
 * phase can already animate the right stick. Probability is uniform across
 * the loaded sticks; upstream `weightedPickN` already did score-weighted
 * selection.
 */
export function KujiModal({ picks, onClose }: KujiModalProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);

  // shaking → drawing
  useEffect(() => {
    if (phase !== "shaking") return;
    const idx = Math.floor(Math.random() * picks.length);
    setWinnerIdx(idx);
    const t = window.setTimeout(() => {
      setPhase("drawing");
      haptic.tap();
    }, SHAKE_MS);
    return () => window.clearTimeout(t);
  }, [phase, picks]);

  // drawing → revealed
  useEffect(() => {
    if (phase !== "drawing" || winnerIdx === null) return;
    const t = window.setTimeout(() => {
      setPhase("revealed");
      setCurrentPick(picks[winnerIdx]);
      haptic.positive();
    }, DRAWING_MS);
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

  const handleShake = () => {
    if (phase !== "ready") return;
    haptic.rollStart();
    setPhase("shaking");
  };

  const handleClose = () => {
    haptic.tap();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="제비뽑기"
      className="fixed inset-0 z-[80] flex flex-col bg-paper"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mincho text-[15px] font-medium text-sumi-ink">
            籤
          </span>
          <span className="font-mincho text-[12px] font-medium text-sumi-mute">
            제비뽑기
          </span>
          <span className="font-mincho text-[11px] num-tabular text-sumi-fade">
            {picks.length}장
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

      {/* Body — AnimatePresence interpolates between stage ↔ revealed
          instead of snapping, so the ceremony feels continuous. */}
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
                count={picks.length}
                phase={phase}
                winnerIdx={winnerIdx}
                onShake={handleShake}
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
 * Pre-reveal stage: headline + cylinder + sticks + splash + ash.
 * All motion is driven by the shared `phase` value via motion variants,
 * so transitions interpolate naturally instead of snapping between states.
 */
function Stage({
  count,
  phase,
  winnerIdx,
  onShake,
}: {
  count: number;
  phase: "ready" | "shaking" | "drawing";
  winnerIdx: number | null;
  onShake: () => void;
}) {
  const sticks = Array.from({ length: count }, (_, i) => {
    const rot = Number(((i - (count - 1) / 2) * 6).toFixed(1));
    return {
      idx: i,
      rot,
      kanji: STICK_KANJI[i % STICK_KANJI.length],
    };
  });

  const headlineCopy =
    phase === "ready"
      ? { jp: "引け", kr: "통을 탭해서 흔들어주세요" }
      : phase === "shaking"
        ? { jp: "振れ", kr: "운명이 섞이는 중 …" }
        : { jp: "当たり", kr: "한 본이 솟아오릅니다" };

  return (
    <div className="relative flex h-full flex-col items-center justify-between px-5 py-6">
      {/* Floating ash — kept as CSS. Infinite ambient loop, no phase
          awareness needed. */}
      <AshLayer />

      {/* Headline swaps per phase with AnimatePresence — crossfade + slight
          Y motion, not a hard jump. The 朱 kanji does a spring scale pulse
          on mount so each phase transition has a subtle "here we go" beat. */}
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
                phase === "shaking"
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={
                phase === "shaking"
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

      {/* Cylinder + sticks */}
      <button
        type="button"
        onClick={onShake}
        disabled={phase !== "ready"}
        aria-label="제비뽑기 시작"
        className="no-select relative z-10 flex flex-col items-center"
      >
        {/* The entire scene shakes as one — rotate + x keyframes decay
            progressively. Sticks add their own finer shake on top for
            compounded motion. */}
        <motion.div
          className="relative flex items-end justify-center"
          style={{ width: 200, height: 380, transformOrigin: "50% 85%" }}
          variants={cylinderVariants}
          animate={phase}
        >
          {/* Splash — staggered spring emit during shake only. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2"
            variants={splashGroupVariants}
            animate={phase}
          >
            {phase === "shaking" &&
              SPLASH.map((s) => (
                <motion.span
                  key={s.id}
                  className="absolute rounded-full bg-sumi-ink"
                  style={{
                    width: s.size,
                    height: s.size,
                    marginLeft: -s.size / 2,
                    marginTop: -s.size / 2,
                    filter: "blur(0.5px)",
                  }}
                  // initial="ready" so each splash starts at center; without
                  // this motion would mount it already-displaced (parent's
                  // animate="shaking" applies on first render).
                  initial="ready"
                  custom={{ sx: s.sx, sy: s.sy }}
                  variants={splashVariants}
                />
              ))}
          </motion.div>

          {/* Halo behind winner — fades in during drawing. */}
          <AnimatePresence>
            {phase === "drawing" && winnerIdx !== null && (
              <motion.div
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: 40,
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle, rgba(28,24,21,0.35) 0%, rgba(28,24,21,0) 70%)",
                  pointerEvents: "none",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>

          {/* Meditate-giraffe watermark — still. She's the meditation
              center while the ceremony shakes around her. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 30, opacity: 0.12, zIndex: 0 }}
          >
            <Mascot variant="meditate" px={340} />
          </span>

          {/* Stick group — parent orchestrates stagger, each stick reads
              phase from its parent animate prop. */}
          <motion.div
            className="absolute left-0 right-0 top-0 bottom-0"
            variants={stickGroupVariants}
            initial="ready"
            animate={phase}
          >
            {sticks.map((s) => (
              <Stick
                key={s.idx}
                rot={s.rot}
                kanji={s.kanji}
                phase={phase}
                isWinner={winnerIdx === s.idx}
              />
            ))}
          </motion.div>

          {/* Cylinder sits ABOVE sticks (z-2) so stick bodies below the
              rim are hidden by the tube front. */}
          <BambooCylinder />
        </motion.div>

        <p className="font-mincho mt-4 text-[11px] tracking-[0.3em] text-sumi-fade">
          {phase === "ready" ? "TAP" : "─"}
        </p>
      </button>

      {/* spacer */}
      <span aria-hidden />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Minimal kuji cylinder — kraft paper silhouette with sumi-ink hairlines.
 *
 * Design intent: match the rest of the editorial page (paper-deep + sumi),
 * not pretend to be a 3D bamboo prop. We dropped the 7-stop bamboo green
 * gradient, sheen overlay, hanko brand, fiber lines, and node-with-shadow
 * 3D bands — they fought the page's quiet ink palette. What remains is just
 * a hand-drawn jar shape: paper body, two thin node hairlines (still
 * implies bamboo), dark mouth for depth, sumi outline.
 */
function BambooCylinder() {
  return (
    <svg
      viewBox="0 0 160 256"
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ width: 168, height: 270, zIndex: 2 }}
      aria-hidden
    >
      <defs>
        {/* Subtle paper-tone body — barely-there tonal shift left → right
            so the silhouette has SOME roundness, but it's not a glossy 3D
            prop. */}
        <linearGradient id="kuji-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#D4C5A4" />
          <stop offset="50%"  stopColor="#E6DBC0" />
          <stop offset="100%" stopColor="#C9BCA0" />
        </linearGradient>

        {/* Mouth shadow — pure sumi-ink darkness with a soft edge so the
            opening reads as "into the tube" without painting fake 3D. */}
        <radialGradient id="kuji-mouth" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0%"   stopColor="#1C1815" stopOpacity="0.95" />
          <stop offset="70%"  stopColor="#1C1815" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#1C1815" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Ground anchor — soft contact shadow */}
      <ellipse
        cx="80"
        cy="252"
        rx="62"
        ry="4"
        fill="#1C1815"
        opacity="0.14"
        style={{ filter: "blur(2.5px)" }}
      />

      {/* Body silhouette — paper fill + sumi 1.5px outline */}
      <path
        d="M 18 38 Q 80 30, 142 38 L 138 240 Q 80 250, 22 240 Z"
        fill="url(#kuji-body)"
      />
      <path
        d="M 18 38 Q 80 30, 142 38 L 138 240 Q 80 250, 22 240 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Two node hairlines — just enough to suggest bamboo segments without
          painting fake raised ridges. 0.6px sumi at low opacity. */}
      {[110, 180].map((y) => (
        <line
          key={`node-${y}`}
          x1="22" y1={y} x2="138" y2={y}
          stroke="#1C1815" strokeWidth="0.6" opacity="0.35"
        />
      ))}

      {/* Mouth ellipse — dark depth + sharp sumi rim on top */}
      <ellipse cx="80" cy="38" rx="62" ry="9" fill="url(#kuji-mouth)" />
      <ellipse
        cx="80" cy="38" rx="62" ry="9"
        fill="none" stroke="#1C1815" strokeWidth="1.5"
      />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Single kuji stick. Variants are built per-stick because each stick has
 * its own resting rotation — shake/draw animations need to oscillate around
 * that rest angle, not a global 0°.
 */
function Stick({
  rot,
  kanji,
  phase,
  isWinner,
}: {
  rot: number;
  kanji: string;
  phase: "ready" | "shaking" | "drawing";
  isWinner: boolean;
}) {
  // Per-stick variants — closure over `rot` and `isWinner` so each stick
  // animates around its own rest position. Spring physics for the rises
  // and drops; keyframe sequence for the shake (motion array notation).
  const variants: Variants = {
    ready: {
      y: 0,
      x: 0,
      opacity: 1,
      rotate: rot,
      scale: 1,
      transition: { type: "spring", stiffness: 220, damping: 18 },
    },
    shaking: {
      // Compounded fine-grain wobble on top of the parent cylinder shake.
      // Decays across the cycle so it doesn't feel mechanical.
      rotate: [rot - 5, rot + 5, rot - 4, rot + 3, rot - 2, rot],
      x: [0, -1.5, 1.5, -1, 1, 0],
      y: [0, -1, 1, -1, 0, 0],
      transition: { duration: 1.1, ease: "easeInOut" },
    },
    drawing: isWinner
      ? {
          y: -110,
          x: 0,
          rotate: rot * 0.3, // straightens slightly as it rises — feels chosen
          scale: 1.12,
          opacity: 1,
          transition: {
            type: "spring",
            stiffness: 180,
            damping: 14,
            mass: 0.8,
          },
        }
      : {
          y: 6,
          rotate: rot,
          scale: 0.94,
          opacity: 0.18,
          transition: { duration: 0.55, ease: [0.4, 0, 0.6, 1] },
        },
  };

  return (
    <motion.span
      className="absolute left-1/2 select-none"
      style={{
        width: 14,
        height: 140,
        bottom: 210,
        marginLeft: -7,
        transformOrigin: "bottom center",
        zIndex: isWinner && phase === "drawing" ? 5 : 1,
      }}
      // Drop in from above on first mount — uses spring via the parent
      // stagger orchestrator.
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      variants={variants}
      animate={phase}
    >
      {/* Drop shadow split out so motion doesn't fight CSS filter. */}
      <span
        className="block h-full w-full"
        style={{
          filter:
            isWinner && phase === "drawing"
              ? "drop-shadow(0 4px 8px rgba(201,129,127,0.55))"
              : "drop-shadow(0 1px 1.5px rgba(28,24,21,0.2))",
        }}
      >
        <svg
          viewBox="0 0 14 140"
          className="block h-full w-full"
          preserveAspectRatio="none"
        >
          {/* Stick body — flat warm wheat fill, sumi outline. */}
          <rect
            x="0.7" y="4" width="12.6" height="134"
            rx="1.2" ry="1.2"
            fill="#E6D6B0"
            stroke="#1C1815"
            strokeWidth="0.7"
          />
          {/* Top accent — slim dusty-shu stripe. */}
          <rect x="0.7" y="4" width="12.6" height="6" fill="#C9817F" />
          <line
            x1="0.7" y1="10" x2="13.3" y2="10"
            stroke="#1C1815" strokeWidth="0.6"
          />
          {/* Kanji label */}
          <text
            x="7"
            y="22"
            textAnchor="middle"
            fontFamily='"Shippori Mincho", serif'
            fontSize="8"
            fontWeight="700"
            fill="#1C1815"
          >
            {kanji}
          </text>
        </svg>
      </span>
    </motion.span>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

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
      {/* Winner — oracle giraffe presents the 運勢吉 scroll above, then
          brushed kanji 大吉 below. Parent variants + named child variants
          so staggerChildren actually works (it's a no-op when children have
          their own animate prop). */}
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

      {/* Pick card — reflects session.currentPick. Changes when user taps
          another candidate below. */}
      <div className="mt-6">
        <PickCard />
      </div>

      {/* All candidates — always visible (no toggle), so the user can
          immediately see "could've been this one" alternatives. */}
      {picks.length > 1 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between border-b border-hairline-soft pb-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mincho text-[14px] font-medium text-sumi-ink">
                籤
              </span>
              <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
                나머지 후보
              </span>
            </div>
            <span className="font-mincho text-[11px] num-tabular text-sumi-fade">
              모두 {picks.length}장
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
