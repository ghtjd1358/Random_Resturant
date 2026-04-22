"use client";

import { useEffect, useRef, useState } from "react";
import {
  startTokyoArrivalChime,
  type ChimeController,
} from "@/lib/audio/tokyoArrivalChime";

const CONFETTI_PALETTE = ["#C8102E", "#E8B94A", "#6B8E4E", "#F08080", "#D4A373", "#FFFFFF"];

// Deterministic burst — 28 pieces spread radially. No RNG so render stays pure.
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.18;
  const distance = 150 + ((i * 17) % 160);
  return {
    id: i,
    color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length]!,
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance - 50,
    rot: ((i * 47) % 720) - 360,
    size: 6 + (i % 7),
    delay: 1.22 + (i % 8) * 0.018,
  };
});

interface TokyoArrivalProps {
  /** Fires after the sequence finishes (or user taps to skip). Always called exactly once. */
  onComplete: () => void;
}

const DURATION_MS = 4500;
const FADE_OUT_MS = 400;

/**
 * "도쿄 도착!" — a short, warm travel-arrival cinematic.
 *
 * Timeline (≈4.5 s):
 *   0.0 – 0.8  sunset gradient fades in
 *   0.5 – 1.2  amber skyline rises from below
 *   1.2 – 2.0  red 「東京」 hanko stamp drops from above with a chime
 *   2.0 – 3.0  confetti bursts, 「도쿄 도착!」 lands
 *   3.0 – 4.5  sub-line + graceful fade-out
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
        "fixed inset-0 z-[100] cursor-pointer overflow-hidden",
        "transition-opacity duration-[400ms] ease-out",
        closing ? "opacity-0" : "opacity-100",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(180deg, #FFE8C4 0%, #FFCBA8 30%, #FFA082 60%, #FF7474 100%)",
      }}
    >
      {/* Drifting sun */}
      <div
        aria-hidden
        className="absolute animate-[arrival-sun_4.5s_ease-out_both]"
        style={{
          right: "18%",
          top: "18%",
          width: "clamp(90px, 18vmin, 160px)",
          height: "clamp(90px, 18vmin, 160px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 38% 35%, #FFF4C4 0%, #FFC86E 55%, #FF8A3C 100%)",
          boxShadow: "0 0 60px 12px rgba(255,180,90,0.55)",
          opacity: 0,
        }}
      />

      {/* Soft cloud streaks */}
      <Clouds />

      {/* Tokyo skyline — rises from below */}
      <Skyline />

      {/* Warm ground haze above the skyline */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[22vh] pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(255,150,100,0.4) 0%, transparent 100%)",
        }}
      />

      {/* 東京 hanko stamp — drops from above, thunks down */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="hanko animate-[arrival-stamp-drop_0.6s_cubic-bezier(0.3,1.5,0.4,1)_both]"
          style={{
            width: "clamp(140px, 28vmin, 220px)",
            height: "clamp(140px, 28vmin, 220px)",
            fontSize: "clamp(56px, 12vmin, 96px)",
            animationDelay: "1.2s",
            opacity: 0,
            transform: "rotate(-8deg)",
          }}
        >
          東京
        </div>
      </div>

      {/* Confetti burst — timed with stamp impact */}
      <Confetti />

      {/* Main greeting */}
      <div className="pointer-events-none absolute inset-x-0 top-[16vh] flex justify-center">
        <div
          className="animate-[arrival-headline_0.8s_cubic-bezier(0.2,1.3,0.3,1)_both] font-heading font-bold text-sumi"
          style={{
            fontSize: "clamp(28px, 7vw, 44px)",
            letterSpacing: "0.02em",
            animationDelay: "1.8s",
            opacity: 0,
            textShadow: "0 2px 0 rgba(255,255,255,0.6), 0 6px 20px rgba(200,80,40,0.25)",
          }}
        >
          도쿄 <span style={{ color: "#C8102E" }}>도착!</span>
        </div>
      </div>

      {/* Sub-line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[18vh] flex justify-center">
        <div
          className="animate-[arrival-fade-up_0.7s_ease-out_both] text-[14px] font-heading font-medium text-sumi-soft"
          style={{
            letterSpacing: "0.2em",
            animationDelay: "2.6s",
            opacity: 0,
          }}
        >
          맛있는 곳, 찾아볼까요?
        </div>
      </div>

      {/* Japanese sub */}
      <div className="pointer-events-none absolute inset-x-0 top-[26vh] flex justify-center">
        <div
          className="animate-[arrival-fade-up_0.6s_ease-out_both] font-heading text-[11px] uppercase text-sumi-soft/80"
          style={{
            letterSpacing: "0.5em",
            animationDelay: "2.2s",
            opacity: 0,
          }}
        >
          ようこそ · 東京
        </div>
      </div>

      {/* Skip hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-5 right-5 text-[10px] tracking-[0.35em] text-sumi/40"
      >
        TAP TO SKIP
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Clouds() {
  return (
    <>
      {[
        { top: "28%", left: "-10%", delay: "0s", scale: 1 },
        { top: "42%", left: "50%", delay: "0.4s", scale: 0.7 },
        { top: "22%", left: "30%", delay: "0.2s", scale: 0.85 },
      ].map((c, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute animate-[arrival-cloud-drift_4.5s_linear_both]"
          style={{
            top: c.top,
            left: c.left,
            animationDelay: c.delay,
            transform: `scale(${c.scale})`,
            opacity: 0,
          }}
        >
          <div
            className="rounded-full bg-white/70"
            style={{
              width: "120px",
              height: "28px",
              filter: "blur(6px)",
            }}
          />
        </div>
      ))}
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Skyline() {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-[38vh] animate-[arrival-skyline-rise_1s_cubic-bezier(0.2,0.9,0.3,1)_both]"
      style={{ animationDelay: "0.5s", opacity: 0 }}
    >
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="arrival-building" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#3D1F0A" />
          </linearGradient>
          <linearGradient id="arrival-tower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4622A" />
            <stop offset="100%" stopColor="#6B2F15" />
          </linearGradient>
        </defs>

        {/* Back ridge of distant buildings */}
        {[
          [30, 150],
          [80, 130],
          [140, 170],
          [200, 140],
          [260, 160],
          [340, 145],
          [420, 165],
          [490, 135],
          [560, 170],
          [630, 150],
          [720, 160],
        ].map(([x, h], i) => (
          <rect
            key={`back-${i}`}
            x={x}
            y={300 - h}
            width={50 + ((i * 7) % 25)}
            height={h}
            fill="url(#arrival-building)"
            opacity={0.65}
          />
        ))}

        {/* Tokyo Tower-ish lattice — centerpiece */}
        <g transform="translate(560, 40)">
          {/* Body triangles */}
          <path
            d="M 40 260 L 0 260 L 28 80 L 52 80 Z"
            fill="url(#arrival-tower)"
          />
          <path
            d="M 28 80 L 52 80 L 48 40 L 32 40 Z"
            fill="url(#arrival-tower)"
          />
          <rect x={34} y={0} width={12} height={40} fill="#6B2F15" />
          <rect x={37} y={-10} width={6} height={10} fill="#6B2F15" />
          {/* Observation deck */}
          <rect x={22} y={100} width={36} height={8} fill="#C8102E" opacity={0.9} />
          <rect x={18} y={160} width={44} height={6} fill="#C8102E" opacity={0.7} />
          {/* Lattice cross-hatching hint */}
          <line x1={6} y1={220} x2={54} y2={220} stroke="#3D1F0A" strokeWidth={1} />
          <line x1={12} y1={180} x2={48} y2={180} stroke="#3D1F0A" strokeWidth={1} />
          <line x1={18} y1={140} x2={42} y2={140} stroke="#3D1F0A" strokeWidth={1} />
        </g>

        {/* Foreground tall blocks */}
        <rect x={80} y={90} width={90} height={210} fill="#2B1810" />
        <rect x={180} y={120} width={70} height={180} fill="#1F1008" />
        <rect x={300} y={60} width={60} height={240} fill="#2B1810" />
        <rect x={370} y={110} width={80} height={190} fill="#1F1008" />
        <rect x={460} y={140} width={50} height={160} fill="#2B1810" />
        <rect x={680} y={120} width={90} height={180} fill="#1F1008" />

        {/* Warm window lights sprinkled */}
        {[
          [110, 150],
          [120, 180],
          [210, 180],
          [310, 140],
          [320, 190],
          [390, 170],
          [420, 220],
          [470, 200],
          [700, 180],
          [720, 220],
        ].map(([x, y], i) => (
          <rect
            key={`win-${i}`}
            x={x}
            y={y}
            width={3}
            height={4}
            fill="#FFE08A"
            opacity={0.95}
          />
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {CONFETTI_PIECES.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 animate-[arrival-confetti_1.8s_cubic-bezier(0.2,0.7,0.3,1)_both]"
          style={
            {
              width: p.size,
              height: p.size * 0.4,
              background: p.color,
              borderRadius: "1px",
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              opacity: 0,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
