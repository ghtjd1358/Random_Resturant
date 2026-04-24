"use client";

import { memo, useEffect, useState } from "react";
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

// Slightly extended for a more luxurious cadence — anticipation +
// follow-through eat ~150ms each, and the winner reveal earns a beat to
// breathe. Total ceremony: ~3.0s shake→reveal.
const SHAKE_MS = 1400;
const DRAWING_MS = 1200;

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

// Cylinder shake — applies Disney's anticipation + squash/stretch +
// follow-through principles via a multi-stage keyframe sequence.
//
//   0-7%:   anticipation (subtle pull-back rotate, a moment of stillness
//           before the shake — preps the eye)
//   7-82%:  decaying shake with paired scaleY/scaleX (volume-preserving
//           squash/stretch — the cylinder feels alive, not a rigid box)
//   82-100%: follow-through wobble (carries inertia after the user
//           released, sells the physical heft)
const cylinderVariants: Variants = {
  ready: { rotate: 0, x: 0, scaleX: 1, scaleY: 1 },
  shaking: {
    rotate: [0, -4, -1, -8, 7, -5, 4, -2, 0, 1.5, -1, 0],
    x: [0, -2, 1, -3, 2, -2, 1, 0, 0, 0.5, -0.5, 0],
    scaleY: [1, 1.025, 0.99, 1.03, 0.97, 1.02, 0.985, 1.005, 1, 1.002, 0.998, 1],
    scaleX: [1, 0.985, 1.005, 0.985, 1.02, 0.992, 1.01, 0.997, 1, 0.999, 1.001, 1],
    transition: {
      duration: 1.4,
      times: [0, 0.04, 0.07, 0.18, 0.32, 0.45, 0.58, 0.7, 0.82, 0.88, 0.94, 1],
      ease: "easeInOut",
    },
  },
  // During drawing the cylinder tips slightly forward, like the kuji-master
  // is presenting the result. Spring back to rest after the winner clears.
  drawing: {
    rotate: [0, 3, 1.5, 0],
    y: [0, -1, 0, 0],
    scaleX: 1,
    scaleY: 1,
    x: 0,
    transition: {
      duration: 0.7,
      times: [0, 0.3, 0.6, 1],
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Splash group orchestration — staggered emit during shake so droplets
// flick out in waves, not all at once.
const splashGroupVariants: Variants = {
  shaking: {
    transition: { staggerChildren: 0.05, delayChildren: 0.18 },
  },
  ready: {},
  drawing: {},
};

const splashVariants: Variants = {
  shaking: (custom: { sx: number; sy: number }) => ({
    x: custom.sx,
    y: custom.sy,
    opacity: [0, 0.85, 0],
    scale: [0.3, 1.1, 0.7],
    transition: { duration: 1.1, ease: [0.16, 0.7, 0.32, 1] },
  }),
  ready: { x: 0, y: 0, opacity: 0, scale: 0.3 },
  drawing: { opacity: 0 },
};

// Stick group — staggers initial drop-in and shake. Drawing stagger is
// near-zero so winner rises immediately.
const stickGroupVariants: Variants = {
  ready: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  shaking: { transition: { staggerChildren: 0.04 } },
  drawing: { transition: { staggerChildren: 0.025 } },
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
      {/* Atmospheric layers — kept light. Film grain SVG turbulence got
          axed because the constant rasterization cost wasn't worth the
          opacity-0.05 visual gain. Vignette is a single radial gradient
          (cheap), ash flakes are a CSS infinite loop (GPU). */}
      <Vignette intensity={phase === "drawing" ? 0.5 : 0.28} />
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
          className="relative flex items-end justify-center transform-gpu"
          style={{
            width: 200,
            height: 380,
            transformOrigin: "50% 85%",
            willChange: "transform",
          }}
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

          {/* Light beam — rays radiating up from the cylinder mouth as the
              winner emerges. Two layered radials (warm + cool) for dimension,
              plus a slow rotate so the rays read as living light, not
              decoration. */}
          <AnimatePresence>
            {phase === "drawing" && winnerIdx !== null && (
              <LightBeam />
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
 * Premium kuji cylinder — paper silhouette with washi grain, refined
 * bamboo node bands, and a depth-cued mouth.
 *
 * Design intent: still minimalist (no glossy 3D bamboo green from earlier
 * iterations) but with the small finishing touches that separate "blank
 * shape" from "carefully crafted object":
 *   - Tapered silhouette (slightly wider at top, narrower at base — the
 *     classical omikuji/tsutsu shape)
 *   - 4-stop body gradient with off-axis warmth so the form has depth
 *     without screaming 3D
 *   - Subtle washi grain noise inside the body
 *   - Refined node bands: paired highlight ABOVE + sumi shadow BELOW
 *     reads as raised bamboo joint at a glance
 *   - Inner mouth radial gradient + sharp sumi rim
 *   - Soft inner highlight on the rim catches "ambient light"
 *   - Bottom contact ellipse + secondary fade shadow grounds it
 *   - Tiny 籤 sumi mark at lower body — calligrapher's stamp without the
 *     loud red hanko
 */
function BambooCylinder() {
  return (
    <svg
      viewBox="0 0 160 270"
      className="absolute bottom-0 left-1/2 -translate-x-1/2 transform-gpu"
      style={{ width: 172, height: 290, zIndex: 2 }}
      aria-hidden
    >
      <defs>
        {/* Body — 4-stop with warmer left side (light source upper-left
            convention). Subtle, not Disney glossy. */}
        <linearGradient id="kuji-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C9BCA0" />
          <stop offset="35%"  stopColor="#E2D6B8" />
          <stop offset="70%"  stopColor="#D9CCAE" />
          <stop offset="100%" stopColor="#B8AB8E" />
        </linearGradient>

        {/* Top-to-bottom subtle vignette — slightly darker at the bottom
            so the form has weight, not floating. */}
        <linearGradient id="kuji-shading" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="55%"  stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#1C1815" stopOpacity="0.12" />
        </linearGradient>

        {/* Mouth — dark with a hint of warm bottom (light bouncing inside) */}
        <radialGradient id="kuji-mouth" cx="0.5" cy="0.55" r="0.6">
          <stop offset="0%"   stopColor="#0A0805" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="#1C1815" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3D2F22" stopOpacity="0.65" />
        </radialGradient>

        {/* Bamboo node band — gradient ring with subtle highlight + shadow
            (paired with separate hairlines below for a 3D-ish ridge cue). */}
        <linearGradient id="kuji-node" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#A9997C" stopOpacity="0.6" />
          <stop offset="50%"  stopColor="#7A6D52" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A9997C" stopOpacity="0.6" />
        </linearGradient>

      </defs>

      {/* Ground contact — two-layer shadow: tight + diffuse for proper
          weight. Tight ellipse + larger blurred fade. */}
      <ellipse
        cx="80" cy="262" rx="58" ry="3.5"
        fill="#1C1815" opacity="0.22"
        style={{ filter: "blur(1.5px)" }}
      />
      <ellipse
        cx="80" cy="266" rx="74" ry="6"
        fill="#1C1815" opacity="0.08"
        style={{ filter: "blur(5px)" }}
      />

      {/* Body — base fill, then subtle vertical shading overlay, then
          sumi outline last. (Removed the SVG turbulence washi grain — the
          rasterization cost during shake animations was disproportionate
          to the visual gain.) */}
      <path
        d="M 16 40 Q 80 30, 144 40 L 138 246 Q 80 256, 22 246 Z"
        fill="url(#kuji-body)"
      />
      <path
        d="M 16 40 Q 80 30, 144 40 L 138 246 Q 80 256, 22 246 Z"
        fill="url(#kuji-shading)"
      />
      <path
        d="M 16 40 Q 80 30, 144 40 L 138 246 Q 80 256, 22 246 Z"
        fill="none"
        stroke="#1C1815"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Bamboo node bands — three rings spaced for natural bamboo
          proportions. Each = highlight line above + gradient ring + shadow
          line below. Reads as raised joint without painting 3D. */}
      {[100, 158, 216].map((y) => (
        <g key={`node-${y}`}>
          <line
            x1="20" y1={y - 2.2} x2="140" y2={y - 2.2}
            stroke="#F4ECD2" strokeWidth="0.6" opacity="0.55"
          />
          <rect
            x="16" y={y - 1.5} width="128" height="3"
            fill="url(#kuji-node)" opacity="0.7"
          />
          <line
            x1="20" y1={y + 1.8} x2="140" y2={y + 1.8}
            stroke="#1C1815" strokeWidth="0.5" opacity="0.45"
          />
        </g>
      ))}

      {/* Calligrapher's mark — tiny 籤 in sumi at lower body. Replaces the
          loud red hanko from earlier; this reads as a subtle artist's seal,
          not a stamp. */}
      <text
        x="128"
        y="232"
        fontFamily='"Shippori Mincho", serif'
        fontSize="9"
        fontWeight="500"
        fill="#1C1815"
        opacity="0.55"
      >
        籤
      </text>

      {/* Mouth — dark inner depth + sharp sumi rim. */}
      <ellipse cx="80" cy="40" rx="64" ry="9.5" fill="url(#kuji-mouth)" />
      <ellipse
        cx="80" cy="40" rx="64" ry="9.5"
        fill="none" stroke="#1C1815" strokeWidth="1.4"
      />

      {/* Inner mouth highlight — catches ambient light on the rim's top
          edge. Very thin, very subtle. */}
      <path
        d="M 18 40 Q 80 32, 142 40"
        fill="none"
        stroke="#F4ECD2"
        strokeWidth="0.8"
        opacity="0.45"
      />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Single kuji stick. Variants are built per-stick because each stick has
 * its own resting rotation — shake/draw animations need to oscillate around
 * that rest angle, not a global 0°.
 *
 * memo'd because the shake phase doesn't change props for each stick more
 * than once per cycle, and rot/kanji are stable for the modal's lifetime.
 */
const Stick = memo(function Stick({
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
  // animates around its own rest position. Compound shake (parent cylinder
  // does the macro motion, sticks add fine wobble on top). Drawing is split
  // by isWinner: winner gets a 3-stage cinematic rise, losers stagger fade.
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
      // Compounded jitter — parent cylinder handles macro shake, this is
      // the per-stick chatter inside the can.
      rotate: [rot - 5, rot + 5, rot - 4, rot + 3, rot - 2, rot],
      x: [0, -1.5, 1.5, -1, 1, 0],
      y: [0, -1.5, 1, -1, 0.5, 0],
      transition: { duration: 1.1, ease: "easeInOut" },
    },
    drawing: isWinner
      ? {
          // 3-stage rise: anticipation pause → quick straightening lift →
          // slow settling overshoot. Reads like a chosen object presented
          // with intention, not a CSS pop.
          y: [0, -2, -120, -110],
          x: 0,
          rotate: [rot, rot * 0.6, rot * 0.2, 0],
          scale: [1, 1.04, 1.18, 1.14],
          opacity: 1,
          transition: {
            duration: 1.0,
            times: [0, 0.18, 0.7, 1],
            ease: [0.22, 1, 0.36, 1],
          },
        }
      : {
          // Losers descend slightly, fade and gray out — by zone of
          // attention they yield the focus to the winner stick.
          y: 8,
          rotate: rot,
          scale: 0.92,
          opacity: 0.14,
          filter: "saturate(0.4) blur(0.5px)",
          transition: { duration: 0.65, ease: [0.4, 0, 0.6, 1] },
        },
  };

  // Winner during drawing gets a layered glow that pulses — combines a
  // close-in dusty-shu shadow with a wider warm-light bloom. Losers keep
  // a flat sumi micro-shadow for grounding without pulling focus.
  const winnerGlow = isWinner && phase === "drawing";
  const filter = winnerGlow
    ? "drop-shadow(0 0 12px rgba(201,129,127,0.55)) drop-shadow(0 8px 24px rgba(232,185,74,0.35))"
    : "drop-shadow(0 1px 1.5px rgba(28,24,21,0.2))";

  return (
    <motion.span
      className="absolute left-1/2 select-none transform-gpu"
      style={{
        width: 14,
        height: 140,
        bottom: 210,
        marginLeft: -7,
        transformOrigin: "bottom center",
        zIndex: winnerGlow ? 5 : 1,
        willChange: "transform, opacity",
      }}
      initial={{ y: -40, opacity: 0, rotate: 0 }}
      variants={variants}
      animate={phase}
    >
      {/* Drop shadow split out so motion doesn't fight CSS filter. */}
      <span className="block h-full w-full" style={{ filter }}>
        <svg
          viewBox="0 0 14 140"
          className="block h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Subtle 3-stop wood — light at edges, slightly darker center
                gives the stick gentle roundness (real omikuji sticks are
                round dowels) without being a glossy bevel. */}
            <linearGradient
              id={`stick-wood-${rot}`}
              x1="0" y1="0" x2="1" y2="0"
            >
              <stop offset="0%"   stopColor="#D4C19A" />
              <stop offset="50%"  stopColor="#E6D6B0" />
              <stop offset="100%" stopColor="#C7B58D" />
            </linearGradient>
            {/* Cap — dusty-shu with a subtle vertical fade so the band
                has dimension instead of flat color */}
            <linearGradient
              id={`stick-cap-${rot}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%"  stopColor="#D49A98" />
              <stop offset="100%" stopColor="#B5736F" />
            </linearGradient>
          </defs>

          {/* Body — wood gradient fill + thin sumi outline */}
          <rect
            x="0.7" y="6" width="12.6" height="132"
            rx="1.4" ry="1.4"
            fill={`url(#stick-wood-${rot})`}
            stroke="#1C1815"
            strokeWidth="0.6"
          />

          {/* Wood grain — single hairline down the center, very low
              opacity. Implies the dowel without being literal. */}
          <line
            x1="7" y1="14" x2="7" y2="135"
            stroke="#1C1815" strokeWidth="0.25" opacity="0.18"
          />

          {/* Cap — dusty-shu band, slightly taller than before so the
              proportion reads more like an omikuji stick (stalk:cap ≈ 22:1
              feels right). */}
          <rect
            x="0.7" y="6" width="12.6" height="6.5"
            fill={`url(#stick-cap-${rot})`}
          />
          {/* Hairline separator — keeps the cap crisp against the body */}
          <line
            x1="0.7" y1="12.5" x2="13.3" y2="12.5"
            stroke="#1C1815" strokeWidth="0.55"
          />

          {/* Cherry-blossom dot at the very top tip — traditional omikuji
              marker. Gives the stick a finishing detail without adding
              chunky mass. */}
          <circle cx="7" cy="9" r="1.05" fill="#8B2515" />
          <circle cx="7" cy="9" r="0.4" fill="#F4ECD2" opacity="0.5" />

          {/* Kanji label — pushed slightly down to make room for the
              taller cap. */}
          <text
            x="7"
            y="24"
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
});

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

/**
 * Vignette — soft dark wash at the corners that focuses the eye toward
 * the center cylinder. Intensity prop lifts during the drawing phase to
 * dim the background and emphasize the rising winner stick.
 */
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

/**
 * Light beam — radial light rays emerging from the cylinder mouth as the
 * winner stick rises. Two layered radials (warm core + cool halo) plus a
 * slow rotate so the rays read as living light, not a static halo.
 */
function LightBeam() {
  return (
    <>
      {/* Warm core — close-in golden glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: 30,
          width: 240,
          height: 240,
          background:
            "radial-gradient(circle, rgba(232,185,74,0.45) 0%, rgba(232,185,74,0.18) 35%, rgba(232,185,74,0) 70%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.85], scale: [0.5, 1.15, 1] }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 1.0,
          times: [0, 0.6, 1],
          ease: [0.22, 1, 0.36, 1],
        }}
      />

      {/* Outer halo — second radial layer for dimension. No rotation;
          the original conic-gradient + mask + infinite rotate combo was
          repainting the entire halo region every frame and felt heavy.
          A second static radial reads almost the same with near-zero cost. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: 10,
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(232,185,74,0.18) 0%, rgba(232,185,74,0) 55%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.7, scale: [0.7, 1.05, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
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
