"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { PickCard } from "@/components/home/PickCard";
import type { PlaceLite } from "@/lib/places/types";

// Omikuji-style fortune kanji rotated through the sticks. The winner gets
// 大吉 ("great fortune") at reveal time so users learn the pattern.
const STICK_KANJI = ["吉", "中", "末", "小", "凶", "半", "平", "福"];

const SHAKE_MS = 1100;
const DRAWING_MS = 900;

// Deterministic ink splash positions — flicked off the cylinder lip during
// shake. No RNG so render stays pure for React 19.
const SPLASH = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.3;
  const distance = 90 + ((i * 23) % 70);
  return {
    id: i,
    sx: Math.cos(angle) * distance,
    sy: Math.sin(angle) * distance - 30,
    size: 4 + (i % 4),
    delay: 0.05 + (i % 5) * 0.06,
    duration: 1.0 + (i % 3) * 0.15,
  };
});

// Slow ash flakes drifting upward through the whole ceremony.
const ASH = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: 8 + ((i * 13) % 84),
  size: 3 + (i % 3),
  delay: (i * 0.4) % 3,
  duration: 4 + (i % 3),
  ashX: ((i * 17) % 30) - 15,
  ashRot: 90 + (i * 47) % 180,
}));

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

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto">
        {phase !== "revealed" ? (
          <Stage
            count={picks.length}
            phase={phase}
            winnerIdx={winnerIdx}
            onShake={handleShake}
          />
        ) : (
          <RevealedView picks={picks} winnerIdx={winnerIdx ?? 0} />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Pre-reveal stage: headline + bamboo cylinder + sticks + splash + ash.
 * One component because all of these animate in lockstep with `phase`.
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
    const rot = ((i - (count - 1) / 2) * 6).toFixed(1);
    return {
      idx: i,
      rot,
      dropDelay: 0.08 * i,
      shakeDelay: 0.05 * i,
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
      {/* Floating ash — runs the entire ceremony as ambient layer */}
      <AshLayer />

      {/* Big editorial headline */}
      <div className="z-10 flex flex-col items-center text-center">
        <p
          className={cn(
            "font-mincho text-shu",
            phase === "shaking" && "animate-[kuji-headline-pulse_900ms_ease-in-out_infinite]",
          )}
          style={{ fontSize: "clamp(40px, 11vmin, 64px)", fontWeight: 600, lineHeight: 1 }}
        >
          {headlineCopy.jp}
        </p>
        <p className="font-mincho mt-2 text-[12px] tracking-tight text-sumi-mute break-keep">
          {headlineCopy.kr}
        </p>
      </div>

      {/* Cylinder + sticks */}
      <button
        type="button"
        onClick={onShake}
        disabled={phase !== "ready"}
        aria-label="제비뽑기 시작"
        className="no-select relative z-10 flex flex-col items-center"
      >
        <div
          className={cn(
            "relative flex items-end justify-center",
            phase === "shaking" && "animate-[kuji-shake_1100ms_ease-in-out_1]",
          )}
          style={{ width: 200, height: 380 }}
        >
          {/* Splash droplets — only during shake */}
          {phase === "shaking" && <SplashLayer />}

          {/* Halo behind winner during drawing */}
          {phase === "drawing" && winnerIdx !== null && (
            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 animate-[kuji-halo_900ms_ease-out_both]"
              style={{
                top: 40,
                width: 200,
                height: 200,
                background:
                  "radial-gradient(circle, rgba(28,24,21,0.35) 0%, rgba(28,24,21,0) 70%)",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Sticks — only the *visible* tip protruding above the cylinder
              opening. The hidden lower portion is implied (real omikuji
              sticks live inside the tube). */}
          {sticks.map((s) => (
            <Stick
              key={s.idx}
              rot={s.rot}
              dropDelay={s.dropDelay}
              shakeDelay={s.shakeDelay}
              kanji={s.kanji}
              phase={phase}
              isWinner={winnerIdx === s.idx}
            />
          ))}

          {/* Bamboo cylinder — sits ABOVE sticks (z-2) so any stick body
              that reaches into the tube is hidden by the cylinder front. */}
          <BambooCylinder />
        </div>

        <p className="font-mincho mt-4 text-[11px] tracking-[0.3em] text-sumi-fade">
          {phase === "ready" ? "TAP" : phase === "shaking" ? "─" : "─"}
        </p>
      </button>

      {/* spacer */}
      <span aria-hidden />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Bamboo (竹籤) cylinder. Slimmer than v1, muted-green palette so it
 * actually reads as bamboo, and z-index 2 so the front of the tube
 * properly hides the lower body of the sticks behind it.
 */
function BambooCylinder() {
  return (
    <svg
      viewBox="0 0 160 240"
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ width: 160, height: 240, zIndex: 2 }}
      aria-hidden
    >
      <defs>
        {/* Muted bamboo green — light edges + saturated middle band so the
            cylinder reads as a curved surface, not a flat rectangle. */}
        <linearGradient id="bamboo-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A8B888" />
          <stop offset="18%" stopColor="#C8D5A8" />
          <stop offset="50%" stopColor="#E0E8C5" />
          <stop offset="82%" stopColor="#C2D0A2" />
          <stop offset="100%" stopColor="#94A878" />
        </linearGradient>
        <radialGradient id="bamboo-hole" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#1C1815" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#2B2520" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3D332B" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      {/* Cylinder body — narrower waist with subtle perspective */}
      <path
        d="M 14 36 Q 80 26, 146 36 L 142 226 Q 80 236, 18 226 Z"
        fill="url(#bamboo-body)"
        stroke="#1C1815"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Bamboo node bands — three horizontal subtle ridges (taller body
          gets more nodes to keep proportions natural) */}
      <g stroke="#1C1815" strokeLinecap="round">
        <line x1="18" y1="92" x2="142" y2="92" strokeWidth="1.4" opacity="0.55" />
        <line x1="18" y1="94" x2="142" y2="94" strokeWidth="0.6" opacity="0.3" />
        <line x1="18" y1="148" x2="142" y2="148" strokeWidth="1.4" opacity="0.55" />
        <line x1="18" y1="150" x2="142" y2="150" strokeWidth="0.6" opacity="0.3" />
        <line x1="18" y1="200" x2="142" y2="200" strokeWidth="1.4" opacity="0.5" />
      </g>

      {/* Vertical fiber hints */}
      <g stroke="#1C1815" strokeWidth="0.5" opacity="0.2">
        <line x1="40" y1="40" x2="38" y2="224" />
        <line x1="62" y1="38" x2="61" y2="228" />
        <line x1="98" y1="38" x2="100" y2="228" />
        <line x1="122" y1="40" x2="125" y2="224" />
      </g>

      {/* 朱 hanko brand near the lower-middle */}
      <g transform="translate(80, 175)">
        <rect
          x="-13"
          y="-13"
          width="26"
          height="26"
          fill="none"
          stroke="#B3321D"
          strokeWidth="1.5"
        />
        <text
          textAnchor="middle"
          y="5"
          fontFamily='"Shippori Mincho", serif'
          fontSize="18"
          fontWeight="600"
          fill="#B3321D"
        >
          籤
        </text>
      </g>

      {/* Top opening — dark "into the tube" depth */}
      <ellipse cx="80" cy="36" rx="66" ry="9" fill="url(#bamboo-hole)" />
      {/* Top lip — sharp sumi rim */}
      <ellipse
        cx="80"
        cy="36"
        rx="66"
        ry="9"
        fill="none"
        stroke="#1C1815"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Stick({
  rot,
  dropDelay,
  shakeDelay,
  kanji,
  phase,
  isWinner,
}: {
  rot: string;
  dropDelay: number;
  shakeDelay: number;
  kanji: string;
  phase: "ready" | "shaking" | "drawing";
  isWinner: boolean;
}) {
  // Pick the right animation per phase. Each stick keeps its own --rot so
  // shake/loser-fade can rotate around its rest position.
  let animation: string;
  if (phase === "shaking") {
    animation = `kuji-stick-shake 0.6s ease-in-out ${shakeDelay}s both infinite alternate`;
  } else if (phase === "drawing") {
    animation = isWinner
      ? `kuji-winner-rise 900ms cubic-bezier(0.2,1.3,0.4,1) both`
      : `kuji-loser-fade 800ms ease-out both`;
  } else {
    animation = `kuji-stick-drop 0.6s cubic-bezier(0.3,1.2,0.4,1) ${dropDelay}s both`;
  }

  // Sticks sit so their *base* dips just inside the cylinder mouth (≈13px
  // below the rim). The cylinder SVG is z-2 so anything below that point
  // is hidden by the tube front. Visible portion is height 130.
  return (
    <span
      className="absolute left-1/2 -translate-x-1/2 select-none"
      style={
        {
          "--rot": `${rot}deg`,
          width: 12,
          height: 130,
          bottom: 200,
          transformOrigin: "bottom center",
          animation,
          zIndex: isWinner && phase === "drawing" ? 5 : 1,
        } as React.CSSProperties
      }
    >
      {/* Stick body — narrower (12px) for a slimmer, more bamboo-like look */}
      <span
        className="block h-full w-full border border-sumi-ink bg-paper-soft"
        style={{
          borderRadius: 2,
          boxShadow:
            isWinner && phase === "drawing"
              ? "0 0 0 1px rgba(179,50,29,0.35), 0 6px 18px -4px rgba(28,24,21,0.45)"
              : undefined,
        }}
      />
      {/* Kanji label near top */}
      <span
        className="font-mincho absolute left-1/2 top-3 -translate-x-1/2 text-sumi-ink"
        style={{ fontSize: 10, fontWeight: 600 }}
      >
        {kanji}
      </span>
      {/* 朱 cap dot at the very top */}
      <span
        aria-hidden
        className="absolute left-1/2 top-[-3px] size-2 -translate-x-1/2 rounded-full bg-shu"
      />
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function SplashLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2"
    >
      {SPLASH.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-sumi-ink"
          style={
            {
              width: s.size,
              height: s.size,
              left: 0,
              top: 0,
              marginLeft: -s.size / 2,
              marginTop: -s.size / 2,
              "--sx": `${s.sx}px`,
              "--sy": `${s.sy}px`,
              animation: `kuji-splash ${s.duration}s cubic-bezier(0.2,0.7,0.3,1) ${s.delay}s both`,
              filter: "blur(0.5px)",
              opacity: 0,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
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
  const [showRest, setShowRest] = useState(false);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const currentPickId = useSessionStore((s) => s.currentPick?.id);

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Winner — no box, just brushed kanji */}
      <div className="flex flex-col items-center text-center">
        <p className="font-mincho text-[12px] tracking-[0.3em] text-sumi-fade">
          결과
        </p>
        <p
          className="font-mincho mt-1 text-shu"
          style={{ fontSize: 38, fontWeight: 600, lineHeight: 1 }}
        >
          大吉
        </p>
        <p className="font-mincho mt-2 text-[12px] text-sumi-mute break-keep">
          오늘 한 집은 이쪽으로.
        </p>
      </div>

      {/* Pick card — reflects session.currentPick (winner by default;
          changes if user taps another candidate below). */}
      <div className="mt-6">
        <PickCard />
      </div>

      {/* Toggle: 나머지 후보 보기 */}
      {picks.length > 1 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowRest((v) => !v)}
            aria-expanded={showRest}
            className="no-select font-mincho flex w-full items-center justify-between border-y border-hairline-soft py-2.5 text-[12px] tracking-tight text-sumi-mute transition-colors hover:text-sumi-ink"
          >
            <span>나머지 {picks.length - 1}곳 함께 보기</span>
            <span className="text-[10px] text-sumi-fade">
              {showRest ? "닫기" : "펼치기"}
            </span>
          </button>

          {showRest && (
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
          )}

          {showRest && (
            <p className="font-mincho mt-3 text-center text-[11px] text-sumi-fade break-keep">
              항목을 누르면 위 카드가 그쪽으로 바뀝니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
