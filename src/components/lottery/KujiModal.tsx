"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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

          {/* Meditate-giraffe watermark — sits BEHIND the tube as a
              silent witness to the draw. Faint enough that the tube + sticks
              stay the focal point; large enough to anchor the empty space
              behind them. No animation — she's the still center while the
              ceremony shakes around her. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 30,
              opacity: 0.12,
              zIndex: 0,
            }}
          >
            <Mascot variant="meditate" px={340} />
          </span>

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
  // is hidden by the tube front.
  return (
    <span
      className="absolute left-1/2 -translate-x-1/2 select-none"
      style={
        {
          "--rot": `${rot}deg`,
          width: 14,
          height: 140,
          bottom: 210,
          transformOrigin: "bottom center",
          animation,
          zIndex: isWinner && phase === "drawing" ? 5 : 1,
          filter: isWinner && phase === "drawing"
            ? "drop-shadow(0 4px 8px rgba(201,129,127,0.55))"
            : "drop-shadow(0 1px 1.5px rgba(28,24,21,0.2))",
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 14 140"
        className="block h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Stick body — flat warm wheat fill with sumi outline. Dropped
            the 5-stop "cylindrical shading" that made it look like a 3D
            dowel; the page is editorial-flat, not glossy. */}
        <rect
          x="0.7" y="4" width="12.6" height="134"
          rx="1.2" ry="1.2"
          fill="#E6D6B0"
          stroke="#1C1815"
          strokeWidth="0.7"
        />

        {/* Top accent band — replaces the chunky red gradient cap with a
            slim muted-shu stripe. Dusty terracotta (#C9817F) instead of the
            full saturation #B3321D; the previous version fought with the
            paper palette. */}
        <rect
          x="0.7" y="4" width="12.6" height="6"
          fill="#C9817F"
        />
        {/* Hairline separating cap from body — keeps the band crisp */}
        <line x1="0.7" y1="10" x2="13.3" y2="10" stroke="#1C1815" strokeWidth="0.6" />

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
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const currentPickId = useSessionStore((s) => s.currentPick?.id);

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Winner — oracle giraffe presents the 運勢吉 scroll above, then
          brushed kanji 大吉 below. The mascot anchors the ceremony so the
          result text reads as something she's revealing, not just a label. */}
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden
          className="animate-[kuji-oracle-bow_900ms_ease-out_both]"
          style={{ transformOrigin: "bottom center" }}
        >
          <Mascot variant="scroll-fortune" size="lg" />
        </span>
        <p className="font-mincho mt-1 text-[12px] tracking-[0.3em] text-sumi-fade">
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
