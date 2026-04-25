"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { useLotteryStore } from "@/stores/useLotteryStore";
import { PickCard } from "@/components/home/PickCard";
import { Mascot } from "@/components/common/Mascot";
import type { PlaceLite } from "@/lib/places/types";

// Three.js scenes — lazy-loaded so the ~150KB R3F bundle only ships when
// the user opens the lottery modal. Both stages share the same R3F deps,
// so loading one warms the cache for the other.
const Yabawi3DStage = dynamic(
  () => import("./Yabawi3DStage").then((m) => m.Yabawi3DStage),
  { ssr: false },
);
const Kuji3DStage = dynamic(
  () => import("./Kuji3DStage").then((m) => m.Kuji3DStage),
  { ssr: false },
);

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

// Slowed down so the shuffle is actually perceivable. v1 was 1.9s for 4
// swaps = ~475ms each, which felt instant. 2.6s gives each swap a
// satisfying ~650ms beat with anticipation + arc + landing all readable.
const SHUFFLE_MS = 2600;
const SETTLED_PAUSE_MS = 320;
const REVEAL_MS = 1000;

// 3-bowl version — shell game tradition. The 3D Stage owns the slot
// math (positions, swap sequence, trajectories) so this constant is just
// a cap for the winner picker.
const NUM_BOWLS = 3;

interface YabawiModalProps {
  picks: PlaceLite[];
  onClose: () => void;
}

type Phase = "ready" | "shuffling" | "settled" | "revealing" | "revealed";

export function YabawiModal({ picks, onClose }: YabawiModalProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const style = useLotteryStore((s) => s.style);
  const isYabawi = style === "yabawi";

  // shuffling → settled. Winner is decided in handleStart (BEFORE phase
  // change) so isWinner doesn't toggle mid-animation — that was making
  // variants re-memo and motion silently restart from the current state,
  // which looked like "no shuffle".
  useEffect(() => {
    if (phase !== "shuffling") return;
    const t = window.setTimeout(() => {
      setPhase("settled");
      haptic.tap();
    }, SHUFFLE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

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

  // Cap the winner pool at the visible mesh count: yabawi shows 3 bowls,
  // kuji shows whatever the user picked (up to picks.length sticks).
  const visibleCount = isYabawi
    ? Math.min(picks.length, NUM_BOWLS)
    : picks.length;

  const handleStart = () => {
    if (phase !== "ready") return;
    haptic.rollStart();
    // Decide winner UPFRONT so isWinner is stable from the moment the
    // animation starts. Setting it inside an effect caused mid-animation
    // re-renders that aborted the keyframe sequence.
    const idx = Math.floor(Math.random() * visibleCount);
    setWinnerIdx(idx);
    setPhase("shuffling");
  };

  const handleClose = () => {
    haptic.tap();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label={isYabawi ? "야바위" : "제비뽑기"}
      className="fixed inset-0 z-[80] flex flex-col bg-paper"
    >
      {/* Top bar — kanji + label + count change with the active style */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mincho text-[15px] font-medium text-sumi-ink">
            {isYabawi ? "椀" : "籤"}
          </span>
          <span className="font-mincho text-[12px] font-medium text-sumi-mute">
            {isYabawi ? "야바위" : "제비뽑기"}
          </span>
          <span className="font-mincho text-[11px] num-tabular text-sumi-fade">
            {visibleCount}
            {isYabawi ? "그릇" : "장"}
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
                onStart={handleStart}
                isYabawi={isYabawi}
                count={visibleCount}
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
  onStart,
  isYabawi,
  count,
}: {
  phase: "ready" | "shuffling" | "settled" | "revealing";
  winnerIdx: number | null;
  onStart: () => void;
  isYabawi: boolean;
  count: number;
}) {
  // Headline copy is style-specific so the JP kanji + KR sub matches the
  // metaphor (椀/籤, 그릇/막대, etc).
  const headlineCopy = isYabawi
    ? phase === "ready"
      ? { jp: "選べ", kr: "그릇을 탭해서 셔플 시작" }
      : phase === "shuffling"
        ? { jp: "混", kr: "셔플 중 …" }
        : phase === "settled"
          ? { jp: "止", kr: "어디일까요" }
          : { jp: "出", kr: "한 그릇이 들립니다" }
    : phase === "ready"
      ? { jp: "引け", kr: "통을 탭해서 흔들어주세요" }
      : phase === "shuffling"
        ? { jp: "振れ", kr: "운명이 섞이는 중 …" }
        : phase === "settled"
          ? { jp: "止", kr: "한 본이 솟아오릅니다" }
          : { jp: "当たり", kr: "한 본이 솟아올랐어요" };

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

      {/* 3D bowl stage — Three.js Canvas with real meshes, lighting,
          shadows. Mascot watermark sits behind in 2D. */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center">
        {/* Meditate-giraffe watermark — sits behind the 3D scene at low
            opacity. Pure 2D, no 3D conflict. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0.08, zIndex: 0 }}
        >
          <Mascot variant="meditate" px={280} />
        </span>

        {/* The 3D canvas itself. The Stage swaps between the two scenes
            based on the user's chosen style. Both scenes share the same
            R3F Canvas footprint, so layout stays consistent. */}
        <div className="relative z-10 h-[360px] w-full max-w-[440px]">
          {isYabawi ? (
            <Yabawi3DStage
              phase={phase}
              winnerIdx={winnerIdx}
              onStart={onStart}
            />
          ) : (
            <Kuji3DStage
              phase={phase}
              winnerIdx={winnerIdx}
              count={count}
              onStart={onStart}
            />
          )}
        </div>

        <p className="font-mincho mt-2 text-[11px] tracking-[0.3em] text-sumi-fade">
          {phase === "ready" ? "TAP TO SHUFFLE" : "─"}
        </p>
      </div>
    </div>
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

