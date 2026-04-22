"use client";

import { useEffect, useRef, useState } from "react";

interface ShibuyaIncidentProps {
  /** Fires after the sequence finishes (or user taps to skip). Always called exactly once. */
  onComplete: () => void;
}

const DURATION_MS = 4600;

export function ShibuyaIncident({ onComplete }: ShibuyaIncidentProps) {
  const [closing, setClosing] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setClosing(true);
    // Wait for fade-out transition before unmounting.
    window.setTimeout(onComplete, 400);
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, DURATION_MS);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
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
        "transition-opacity duration-[400ms] ease-out",
        closing ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      {/* Cursed-energy haze — red + purple radial plasma, flickering */}
      <div
        aria-hidden
        className="absolute inset-0 animate-[shibuya-flicker_2.4s_steps(1,end)_infinite]"
        style={{
          background: [
            "radial-gradient(ellipse 55% 40% at 28% 32%, rgba(200,16,46,0.55), transparent 70%)",
            "radial-gradient(ellipse 60% 45% at 72% 68%, rgba(139,0,24,0.65), transparent 72%)",
            "radial-gradient(ellipse 45% 30% at 52% 50%, rgba(124,58,179,0.50), transparent 70%)",
            "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(80,10,20,0.8), transparent 75%)",
          ].join(","),
        }}
      />

      {/* Purple cursed halo — slow pulse */}
      <div
        aria-hidden
        className="absolute inset-0 animate-[shibuya-halo_3s_ease-in-out_infinite] mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(155,81,224,0.35), transparent 55%)",
        }}
      />

      {/* Horizontal scan line — sweeps down once */}
      <div
        aria-hidden
        className="absolute inset-x-0 h-[3px] animate-[shibuya-scan_2.2s_ease-in_forwards] opacity-70"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(200,16,46,0.9) 20%, rgba(255,255,255,0.8) 50%, rgba(200,16,46,0.9) 80%, transparent)",
          boxShadow: "0 0 24px 6px rgba(200,16,46,0.8)",
          top: "-3px",
        }}
      />

      {/* Center content */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 px-6">
        {/* 呪 sigil — massive, glowing purple */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 animate-[shibuya-halo_1.8s_ease-in-out_infinite] rounded-full blur-3xl"
            style={{ background: "rgba(124,58,179,0.55)" }}
          />
          <span
            className="relative block animate-[shibuya-sigil-in_1.2s_cubic-bezier(0.2,0.8,0.2,1)_both] font-heading font-bold leading-none text-white"
            style={{
              fontSize: "clamp(140px, 44vw, 220px)",
              textShadow:
                "0 0 18px #9B51E0, 0 0 36px #7C3AB3, 0 0 72px #5C1A8E, 0 0 120px #C8102E",
              animationDelay: "0.3s",
            }}
          >
            呪
          </span>
        </div>

        {/* 渋谷事変 — crushed-in crimson kanji */}
        <div
          className="mt-2 animate-[shibuya-kanji-crush_1s_cubic-bezier(0.2,0.9,0.25,1)_both] font-heading font-bold"
          style={{
            fontSize: "clamp(32px, 9vw, 56px)",
            color: "#E53E3E",
            letterSpacing: "0.32em",
            textShadow:
              "0 0 12px rgba(200,16,46,0.9), 0 0 28px rgba(139,0,24,0.7), 2px 2px 0 rgba(0,0,0,0.4)",
            animationDelay: "1.3s",
          }}
        >
          渋谷事変
        </div>

        {/* Date subtitle */}
        <div
          className="mt-1 animate-[shibuya-fade-up_0.9s_ease-out_both] font-heading text-[11px] uppercase text-white/70"
          style={{ letterSpacing: "0.55em", animationDelay: "2.0s" }}
        >
          十月三十一日 · 2018
        </div>

        {/* Korean welcome line */}
        <div
          className="mt-10 animate-[shibuya-fade-up_0.8s_ease-out_both] text-[13px] text-white/85"
          style={{ letterSpacing: "0.3em", animationDelay: "2.5s" }}
        >
          ― 시부야에 오신 걸 환영합니다 ―
        </div>
      </div>

      {/* Final white flash — last ~400ms */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-[shibuya-final-flash_0.6s_ease-out_both]"
        style={{
          background: "white",
          animationDelay: "4.0s",
        }}
      />

      {/* Skip hint */}
      <div
        className="absolute bottom-6 right-6 text-[10px] tracking-[0.35em] text-white/40"
        aria-hidden
      >
        TAP TO SKIP
      </div>
    </div>
  );
}
