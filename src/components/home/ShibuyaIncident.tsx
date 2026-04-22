"use client";

import { useEffect, useRef, useState } from "react";
import { startShibuyaBgm, type BgmController } from "@/lib/audio/shibuyaBgm";

interface ShibuyaIncidentProps {
  /** Fires after the sequence finishes (or user taps to skip). Always called exactly once. */
  onComplete: () => void;
}

const DURATION_MS = 7000;
const FADE_OUT_MS = 500;

/**
 * Cinematic intro sequence played when the user first lands in Shibuya.
 *
 * Timeline (≈7 s):
 *   0.0 – 1.5  street-level close-up, red neon flicker, drone fades in
 *   1.5 – 3.0  camera tilts up, buildings slide down, taiko hits
 *   3.0 – 4.5  night sky revealed with demon-king silhouette rising
 *   4.5 – 5.5  「伏魔御厨子」 kanji crash + circular shockwave + bell
 *   5.5 – 7.0  white flash, 「시부야에 오신 걸 환영합니다」, fade out
 */
export function ShibuyaIncident({ onComplete }: ShibuyaIncidentProps) {
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);
  const bgmRef = useRef<BgmController | null>(null);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    bgmRef.current?.stop();
    setClosing(true);
    window.setTimeout(onComplete, FADE_OUT_MS);
  };

  useEffect(() => {
    bgmRef.current = startShibuyaBgm();
    const timer = window.setTimeout(finish, DURATION_MS);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      bgmRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-label="시부야 사변"
      aria-live="assertive"
      onClick={finish}
      className={[
        "fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-black",
        "transition-opacity duration-[500ms] ease-out",
        closing ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      {/* Camera-tilt scene: 200vh-tall container slides upward to reveal sky */}
      <div className="absolute inset-x-0 top-0 h-[200vh] animate-[shibuya-tilt_6.8s_cubic-bezier(0.55,0.05,0.2,1)_both]">
        {/* ── Top half: night sky with demonic silhouette ── */}
        <div className="absolute inset-x-0 top-0 h-[100vh] overflow-hidden">
          <NightSky />
          <DemonKing />
        </div>

        {/* ── Bottom half: Shibuya street level ── */}
        <div className="absolute inset-x-0 bottom-0 h-[100vh] overflow-hidden">
          <StreetLevel />
        </div>
      </div>

      {/* Cursed-energy haze — always on, screen-blended */}
      <div
        aria-hidden
        className="absolute inset-0 animate-[shibuya-flicker_2.4s_steps(1,end)_infinite] mix-blend-screen"
        style={{
          background: [
            "radial-gradient(ellipse 55% 40% at 28% 32%, rgba(200,16,46,0.45), transparent 70%)",
            "radial-gradient(ellipse 60% 45% at 72% 68%, rgba(139,0,24,0.55), transparent 72%)",
            "radial-gradient(ellipse 45% 30% at 52% 50%, rgba(124,58,179,0.45), transparent 70%)",
          ].join(","),
        }}
      />

      {/* Shockwave ring — bursts at 4.5s */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[shibuya-shockwave_1.5s_cubic-bezier(0.2,0.7,0.3,1)_both]"
        style={{
          animationDelay: "4.5s",
          width: "40vmin",
          height: "40vmin",
          borderRadius: "50%",
          border: "4px solid rgba(255,32,64,0.9)",
          boxShadow: "0 0 40px 10px rgba(255,32,64,0.5), inset 0 0 30px rgba(255,32,64,0.4)",
          opacity: 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[shibuya-shockwave_1.8s_cubic-bezier(0.2,0.7,0.3,1)_both]"
        style={{
          animationDelay: "4.65s",
          width: "30vmin",
          height: "30vmin",
          borderRadius: "50%",
          border: "2px solid rgba(155,81,224,0.7)",
          opacity: 0,
        }}
      />

      {/* 伏魔御厨子 — domain name, crashes in at 4.7s */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="animate-[shibuya-kanji-crush_1.1s_cubic-bezier(0.2,0.9,0.25,1)_both] font-heading font-bold"
          style={{
            fontSize: "clamp(36px, 10vw, 72px)",
            color: "#ff1a2a",
            letterSpacing: "0.3em",
            textShadow:
              "0 0 14px rgba(200,16,46,0.95), 0 0 32px rgba(139,0,24,0.8), 0 0 64px rgba(124,58,179,0.6), 2px 2px 0 rgba(0,0,0,0.4)",
            animationDelay: "4.7s",
            opacity: 0,
          }}
        >
          伏魔御厨子
        </div>
      </div>

      {/* Date subtitle */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[32vh]">
        <div
          className="animate-[shibuya-fade-up_0.9s_ease-out_both] font-heading text-[11px] uppercase text-white/70"
          style={{
            letterSpacing: "0.55em",
            animationDelay: "5.1s",
            opacity: 0,
          }}
        >
          十月三十一日 · 2018
        </div>
      </div>

      {/* White flash at 5.6s */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-[shibuya-final-flash_0.7s_ease-out_both]"
        style={{ background: "white", animationDelay: "5.6s", opacity: 0 }}
      />

      {/* Welcome line fades in after the flash */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[16vh] flex justify-center">
        <div
          className="animate-[shibuya-fade-up_0.9s_ease-out_both] text-[13px] text-white/90"
          style={{
            letterSpacing: "0.32em",
            animationDelay: "5.9s",
            opacity: 0,
            textShadow: "0 0 12px rgba(0,0,0,0.9)",
          }}
        >
          ― 시부야에 오신 걸 환영합니다 ―
        </div>
      </div>

      {/* Skip hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 right-6 text-[10px] tracking-[0.35em] text-white/40"
      >
        TAP TO SKIP
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function NightSky() {
  return (
    <div className="absolute inset-0">
      {/* Deep-night gradient with a bruised cursed hue */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #05050f 0%, #140820 35%, #1f0a1e 65%, #2a0a18 100%)",
        }}
      />

      {/* Scattered faint stars */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: [
            "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.9) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 34% 42%, rgba(255,255,255,0.7) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 58% 12%, rgba(255,255,255,0.8) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 72% 36%, rgba(255,255,255,0.6) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 88% 22%, rgba(255,255,255,0.9) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 22% 62%, rgba(255,255,255,0.5) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 46% 74%, rgba(255,255,255,0.6) 50%, transparent 50%)",
            "radial-gradient(1px 1px at 80% 68%, rgba(255,255,255,0.5) 50%, transparent 50%)",
          ].join(","),
        }}
      />

      {/* Blood moon */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "14%",
          top: "10%",
          width: "clamp(70px, 14vmin, 130px)",
          height: "clamp(70px, 14vmin, 130px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 32% 30%, #b83020 0%, #6b0a1a 55%, #1a0208 100%)",
          boxShadow:
            "0 0 50px 8px rgba(200,16,46,0.35), 0 0 120px 24px rgba(139,0,24,0.18)",
        }}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function DemonKing() {
  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-[18vh] -translate-x-1/2 animate-[shibuya-silhouette-rise_2.2s_cubic-bezier(0.2,0.8,0.2,1)_both]"
      style={{
        animationDelay: "2.8s",
        width: "clamp(260px, 54vmin, 520px)",
        opacity: 0,
      }}
    >
      {/* Back aura — slow breathing halo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[shibuya-halo_3.2s_ease-in-out_infinite]"
        style={{
          width: "140%",
          height: "140%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(200,16,46,0.55) 0%, rgba(124,58,179,0.25) 35%, transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      {/* Ashura-style demon-king silhouette — four arms, horned crown */}
      <svg
        viewBox="0 0 200 320"
        className="relative w-full"
        style={{ filter: "drop-shadow(0 0 18px rgba(124,58,179,0.35))" }}
      >
        <defs>
          <linearGradient id="sk-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="100%" stopColor="#0a0005" />
          </linearGradient>
          <radialGradient id="sk-eye" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffe0b0" />
            <stop offset="25%" stopColor="#ff3020" />
            <stop offset="100%" stopColor="#6b0010" />
          </radialGradient>
        </defs>

        {/* Flowing robe — wide base tapering up */}
        <path
          d="M 55 200 Q 30 260 20 320 L 180 320 Q 170 260 145 200 Q 130 180 100 180 Q 70 180 55 200 Z"
          fill="url(#sk-body)"
        />

        {/* Secondary arms (back pair) — raised outward */}
        <path d="M 70 140 Q 40 140 28 175 L 40 180 Q 55 155 78 152 Z" fill="#050505" opacity="0.85" />
        <path d="M 130 140 Q 160 140 172 175 L 160 180 Q 145 155 122 152 Z" fill="#050505" opacity="0.85" />

        {/* Main arms (front pair) — crossed lower */}
        <path d="M 78 160 Q 55 195 50 220 L 62 225 Q 72 200 88 180 Z" fill="#0a0508" />
        <path d="M 122 160 Q 145 195 150 220 L 138 225 Q 128 200 112 180 Z" fill="#0a0508" />

        {/* Torso */}
        <path d="M 72 110 Q 82 150 78 180 L 122 180 Q 118 150 128 110 Z" fill="url(#sk-body)" />

        {/* Shoulder pauldrons — slight dimension */}
        <path d="M 68 108 Q 60 120 68 130 L 84 120 Z" fill="#0a0004" />
        <path d="M 132 108 Q 140 120 132 130 L 116 120 Z" fill="#0a0004" />

        {/* Neck */}
        <path d="M 88 92 L 112 92 L 110 108 L 90 108 Z" fill="#050005" />

        {/* Head — slightly oval */}
        <ellipse cx="100" cy="78" rx="20" ry="24" fill="url(#sk-body)" />

        {/* Horned crown — asymmetric, ragged */}
        <path d="M 82 64 Q 72 42 76 22 L 86 60 Z" fill="#030005" />
        <path d="M 118 64 Q 128 42 124 22 L 114 60 Z" fill="#030005" />
        <path d="M 94 52 Q 96 36 100 30 Q 104 36 106 52 Z" fill="#030005" />

        {/* Glowing eyes */}
        <ellipse cx="93" cy="76" rx="3.2" ry="2.2" fill="url(#sk-eye)">
          <animate
            attributeName="opacity"
            values="0.6;1;0.55;1;0.7"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="107" cy="76" rx="3.2" ry="2.2" fill="url(#sk-eye)">
          <animate
            attributeName="opacity"
            values="1;0.6;1;0.55;0.9"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </ellipse>
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function StreetLevel() {
  return (
    <div className="absolute inset-0">
      {/* Dim sky above buildings */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0614 0%, #150618 40%, #1a0510 75%, #000000 100%)",
        }}
      />

      {/* Distant silhouetted towers */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-around opacity-55">
        {[55, 72, 48, 66, 52, 78, 58].map((h, i) => (
          <div
            key={i}
            className="bg-black"
            style={{ width: `${10 + (i % 2) * 3}%`, height: `${h}vh` }}
          />
        ))}
      </div>

      {/* Closer, taller block buildings */}
      <div className="absolute inset-x-0 bottom-0 flex items-end">
        <div className="h-[68vh] w-[28%] bg-[#05050a]" />
        <div className="h-[82vh] w-[22%] bg-black" />
        <div className="h-[72vh] w-[26%] bg-[#050208]" />
        <div className="h-[86vh] w-[24%] bg-black" />
      </div>

      {/* Red neon window glows — sparse, flickering */}
      {[
        { top: "52vh", left: "18%", delay: "0s" },
        { top: "64vh", left: "34%", delay: "0.4s" },
        { top: "46vh", left: "58%", delay: "0.9s" },
        { top: "72vh", left: "76%", delay: "0.2s" },
      ].map((n, i) => (
        <div
          key={i}
          className="absolute animate-[shibuya-neon-flicker_1.8s_steps(1,end)_infinite]"
          style={{
            top: n.top,
            left: n.left,
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#ff2040",
            boxShadow:
              "0 0 14px 4px rgba(255,32,64,0.8), 0 0 40px 12px rgba(200,16,46,0.4)",
            animationDelay: n.delay,
          }}
        />
      ))}

      {/* Ground-level red haze */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[20vh]"
        style={{
          background:
            "linear-gradient(0deg, rgba(200,16,46,0.35) 0%, rgba(139,0,24,0.18) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
