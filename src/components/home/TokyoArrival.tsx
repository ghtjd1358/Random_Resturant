"use client";

import { useEffect, useRef, useState } from "react";
import {
  startTokyoArrivalChime,
  type ChimeController,
} from "@/lib/audio/tokyoArrivalChime";
import { Mascot } from "@/components/common/Mascot";

interface TokyoArrivalProps {
  /** Fires after the sequence finishes (or user taps to skip). Always called exactly once. */
  onComplete: () => void;
}

const DURATION_MS = 4500;
const FADE_OUT_MS = 400;

// Deterministic ink droplet positions — flicked off the brush, no RNG so the
// render stays pure for React 19.
const DROPLETS = Array.from({ length: 9 }, (_, i) => {
  const angle = (i / 9) * Math.PI * 2 + (i % 2) * 0.4;
  const distance = 110 + ((i * 31) % 90);
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 5 + (i % 4),
    delay: 1.4 + (i % 6) * 0.05,
    duration: 1.6 + (i % 3) * 0.2,
  };
});

/**
 * "도쿄 도착" — sumi-ink + washi paper version.
 *
 * Timeline (≈4.5 s):
 *   0.0 – 0.5  paper background fades in
 *   0.4 – 1.6  big sumi ink wash blooms outward from center
 *   1.0 – 1.8  着 brush kanji wet-fades in over the wash
 *   1.4 – 2.4  ink droplets flick outward from the brush
 *   1.6 – 2.2  brush-wink giraffe pops in lower-left, brush still raised
 *               — narratively "she just painted the 着 you're seeing"
 *   1.8 – 2.4  朱 東京 hanko stamps lower-right (mirrors mascot — balance)
 *   2.0 – 2.8  도쿄 도착 Korean greeting fades in
 *   2.6 – 3.2  ようこそ · 東京 sub-line
 *   3.2 – 4.5  hold + graceful fade-out
 */
export function TokyoArrival({ onComplete }: TokyoArrivalProps) {
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);
  const chimeRef = useRef<ChimeController | null>(null);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    chimeRef.current?.stop();
    setClosing(true);
    window.setTimeout(onComplete, FADE_OUT_MS);
  };

  useEffect(() => {
    chimeRef.current = startTokyoArrivalChime();
    const timer = window.setTimeout(finish, DURATION_MS);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      chimeRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-label="도쿄 도착"
      aria-live="polite"
      onClick={finish}
      className={[
        "fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-paper",
        "transition-opacity duration-[400ms] ease-out",
        closing ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      {/* Sumi ink wash — central halo that bleeds outward */}
      <InkWash />

      {/* Big 着 brush kanji — center of the wash */}
      <BrushKanji />

      {/* Ink droplets flicked from the brush */}
      <InkDroplets />

      {/* Wink giraffe — brush still in hand. Pops in just as the kanji
          finishes appearing, so she reads as the calligrapher who just
          finished the stroke. Lower-left to balance the hanko on the
          right. */}
      <BrushPainter />

      {/* 朱 東京 hanko — small, lower-right corner like a signed stamp */}
      <HankoCorner />

      {/* Korean greeting */}
      <div className="pointer-events-none absolute inset-x-0 top-[18vh] flex justify-center">
        <h1
          className="font-mincho animate-[arrival-headline_0.8s_cubic-bezier(0.2,1.3,0.3,1)_both] font-medium text-sumi-ink"
          style={{
            fontSize: "clamp(28px, 7vw, 44px)",
            letterSpacing: "-0.01em",
            animationDelay: "2.0s",
            opacity: 0,
          }}
        >
          도쿄 <span className="text-shu">도착</span>
        </h1>
      </div>

      {/* JP sub-line */}
      <div className="pointer-events-none absolute inset-x-0 top-[27vh] flex justify-center">
        <p
          className="font-mincho animate-[arrival-fade-up_0.6s_ease-out_both] text-[12px] text-sumi-mute"
          style={{
            letterSpacing: "0.4em",
            animationDelay: "2.6s",
            opacity: 0,
          }}
        >
          ようこそ · 東京
        </p>
      </div>

      {/* Bottom Korean tagline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[20vh] flex justify-center">
        <p
          className="font-mincho animate-[arrival-fade-up_0.7s_ease-out_both] text-[13px] text-sumi-mute"
          style={{
            letterSpacing: "0.18em",
            animationDelay: "2.9s",
            opacity: 0,
          }}
        >
          맛있는 곳, 찾아볼까요
        </p>
      </div>

      {/* Skip hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 right-5 text-[10px] tracking-[0.35em] text-sumi-fade"
      >
        TAP TO SKIP
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Central ink wash — dark sumi halo that bleeds outward like wet brush on
 * washi. SVG turbulence + displacement gives the irregular wet edge that
 * pure CSS radial gradients can't.
 */
function InkWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <svg
        viewBox="0 0 600 600"
        className="absolute h-[110vmin] max-h-[700px] w-[110vmin] max-w-[700px] animate-[arrival-ink-bloom_1.4s_cubic-bezier(0.25,1,0.4,1)_both]"
        style={{ animationDelay: "0.4s", opacity: 0 }}
      >
        <defs>
          <filter id="ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="32" />
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <radialGradient id="ink-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1C1815" stopOpacity="0.78" />
            <stop offset="45%"  stopColor="#1C1815" stopOpacity="0.35" />
            <stop offset="80%"  stopColor="#1C1815" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1C1815" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="240" fill="url(#ink-grad)" filter="url(#ink-bleed)" />
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * 着 (도착의 着, "arrive") in big Mincho. Sits at the center of the ink
 * wash so the kanji reads like brush calligraphy on wet paper.
 */
function BrushKanji() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="font-mincho animate-[arrival-brush-in_1.2s_cubic-bezier(0.22,1,0.36,1)_both] text-paper"
        style={{
          fontSize: "clamp(140px, 32vmin, 260px)",
          fontWeight: 600,
          lineHeight: 1,
          animationDelay: "1.0s",
          opacity: 0,
          textShadow:
            "0 0 24px rgba(28, 24, 21, 0.55), 0 2px 8px rgba(28, 24, 21, 0.4)",
        }}
      >
        着
      </span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function InkDroplets() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute left-1/2 top-1/2">
        {DROPLETS.map((d) => (
          <span
            key={d.id}
            className="absolute animate-[arrival-droplet_1.6s_cubic-bezier(0.3,0.9,0.4,1)_both] rounded-full bg-sumi-ink"
            style={
              {
                width: d.size,
                height: d.size,
                left: 0,
                top: 0,
                marginLeft: -d.size / 2,
                marginTop: -d.size / 2,
                "--dx": `${d.dx}px`,
                "--dy": `${d.dy}px`,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.duration}s`,
                opacity: 0,
                filter: "blur(0.6px)",
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Wink giraffe holding a brush — pops in at 1.6s as if she just finished
 * painting the 着 kanji at center. After the entry bounce she idles with
 * a slow breathing sway so she stays alive through the text reveals.
 */
function BrushPainter() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[12vh] left-[6vw] sm:left-[10vw]"
    >
      <div
        className="animate-[arrival-mascot-pop_0.7s_cubic-bezier(0.3,1.4,0.4,1)_both]"
        style={{
          animationDelay: "1.6s",
          opacity: 0,
          transformOrigin: "bottom center",
        }}
      >
        <div className="animate-[arrival-mascot-breathe_3.2s_ease-in-out_infinite]">
          <Mascot variant="brush-wink" size="lg" />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * 朱 東京 hanko — small signed stamp in the lower-right corner. Replaces the
 * old centered red thunk; this version reads like a calligrapher's seal at
 * the end of the brush stroke.
 */
function HankoCorner() {
  return (
    <div className="pointer-events-none absolute bottom-[16vh] right-[14vw] sm:right-[18vw]">
      <div
        className="animate-[arrival-stamp-drop_0.55s_cubic-bezier(0.3,1.4,0.4,1)_both] flex size-[clamp(64px,14vmin,96px)] flex-col items-center justify-center border-2 border-shu text-shu"
        style={{
          animationDelay: "1.8s",
          opacity: 0,
          transform: "rotate(-6deg)",
          background: "rgba(179, 50, 29, 0.04)",
        }}
      >
        <span
          className="font-mincho leading-none"
          style={{ fontSize: "clamp(16px, 3.5vmin, 24px)", fontWeight: 600 }}
        >
          東京
        </span>
        <span
          className="font-mincho mt-0.5 leading-none tracking-[0.2em] opacity-70"
          style={{ fontSize: "clamp(7px, 1.4vmin, 9px)" }}
        >
          TOKYO
        </span>
      </div>
    </div>
  );
}
