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
const REVEAL_DELAY_MS = 700;

interface KujiModalProps {
  picks: PlaceLite[];
  onClose: () => void;
}

type Phase = "ready" | "shaking" | "revealed";

/**
 * Kuji draw modal. The picks have already been chosen — this just stages
 * the ceremony: cylinder of N sticks → user shakes → winner rises → PickCard.
 *
 * Probability of which stick wins is uniform across the loaded sticks; the
 * upstream `weightedPickN` already did score-weighted selection, so any of
 * the loaded sticks is "good enough" to recommend.
 */
export function KujiModal({ picks, onClose }: KujiModalProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);

  // Phase machine: shaking → revealed → push winner into session.
  useEffect(() => {
    if (phase !== "shaking") return;
    const idx = Math.floor(Math.random() * picks.length);
    const t1 = window.setTimeout(() => {
      setWinnerIdx(idx);
      setPhase("revealed");
      // commit to session so PickCard can render
      setCurrentPick(picks[idx]);
      haptic.positive();
    }, SHAKE_MS + REVEAL_DELAY_MS);
    return () => window.clearTimeout(t1);
  }, [phase, picks, setCurrentPick]);

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

      {/* Body — phases */}
      <div className="relative flex-1 overflow-y-auto">
        {phase !== "revealed" ? (
          <Cylinder
            count={picks.length}
            shaking={phase === "shaking"}
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

function Cylinder({
  count,
  shaking,
  onShake,
}: {
  count: number;
  shaking: boolean;
  onShake: () => void;
}) {
  // Deterministic per-stick offsets so shake reads as natural variance,
  // not synced motion. Same input → same offsets (no RNG in render).
  const sticks = Array.from({ length: count }, (_, i) => {
    const rot = ((i - (count - 1) / 2) * 6).toFixed(1);
    const dropDelay = 0.08 * i;
    const shakeDelay = 0.05 * i;
    return {
      idx: i,
      rot,
      dropDelay,
      shakeDelay,
      kanji: STICK_KANJI[i % STICK_KANJI.length],
    };
  });

  return (
    <div className="flex h-full flex-col items-center justify-between px-5 py-8">
      <p className="font-mincho text-center text-[13px] text-sumi-mute break-keep">
        {shaking ? "흔드는 중 …" : "통을 탭해서 흔들어주세요."}
      </p>

      <button
        type="button"
        onClick={onShake}
        disabled={shaking}
        aria-label="제비뽑기 시작"
        className="no-select relative flex flex-col items-center"
      >
        {/* Sticks — rendered behind the cylinder front so they "stick out" */}
        <div
          className={cn(
            "relative flex items-end justify-center",
            shaking && "animate-[kuji-shake_1100ms_ease-in-out_1]",
          )}
          style={{ width: 220, height: 280 }}
        >
          {sticks.map((s) => (
            <Stick
              key={s.idx}
              rot={s.rot}
              dropDelay={s.dropDelay}
              shakeDelay={s.shakeDelay}
              kanji={s.kanji}
              shaking={shaking}
            />
          ))}

          {/* Cylinder body — sumi outline + paper fill */}
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 -translate-x-1/2 border-2 border-sumi-ink bg-paper"
            style={{
              width: 180,
              height: 130,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              boxShadow: "inset 0 4px 0 rgba(28, 24, 21, 0.05)",
            }}
          >
            {/* Cylinder lip */}
            <div
              aria-hidden
              className="absolute -top-[3px] left-0 right-0 h-1 bg-sumi-ink"
            />
            {/* Hanko brand on the cylinder */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span
                className="hanko-square hanko-square-shu"
                style={{ width: 36, height: 36, fontSize: 18 }}
                aria-hidden
              >
                籤
              </span>
            </div>
          </div>
        </div>

        <p className="mt-6 font-mincho text-[11px] tracking-[0.3em] text-sumi-fade">
          {shaking ? "─" : "TAP"}
        </p>
      </button>

      {/* spacer to push button toward center */}
      <span aria-hidden />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Stick({
  rot,
  dropDelay,
  shakeDelay,
  kanji,
  shaking,
}: {
  rot: string;
  dropDelay: number;
  shakeDelay: number;
  kanji: string;
  shaking: boolean;
}) {
  return (
    <span
      className="absolute bottom-[55px] left-1/2 -translate-x-1/2 select-none"
      style={
        {
          "--rot": `${rot}deg`,
          width: 14,
          height: 200,
          transformOrigin: "bottom center",
          animation: shaking
            ? `kuji-stick-shake 0.6s ease-in-out ${shakeDelay}s both`
            : `kuji-stick-drop 0.6s cubic-bezier(0.3,1.2,0.4,1) ${dropDelay}s both`,
        } as React.CSSProperties
      }
    >
      {/* Stick body — washi paper color with sumi border */}
      <span
        className="block h-full w-full border border-sumi-ink bg-paper-soft"
        style={{ borderRadius: 2 }}
      />
      {/* Kanji label near the top */}
      <span
        className="font-mincho absolute left-1/2 top-2 -translate-x-1/2 text-sumi-ink"
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
  const winner = picks[winnerIdx];

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

      {/* Pick card — reuses Home's card so styling is identical. Reflects
          whatever is currently in session.currentPick (winner by default;
          changes if the user taps another candidate below). */}
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
            className={cn(
              "no-select font-mincho flex w-full items-center justify-between border-y border-hairline-soft py-2.5 text-[12px] tracking-tight text-sumi-mute transition-colors hover:text-sumi-ink",
            )}
          >
            <span>
              나머지 {picks.length - 1}곳 함께 보기
            </span>
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
