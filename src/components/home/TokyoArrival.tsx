"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  startTokyoArrivalChime,
  type ChimeController,
} from "@/lib/audio/tokyoArrivalChime";
import { Mascot } from "@/components/common/Mascot";

interface TokyoArrivalProps {
  /** Fires after the sequence finishes (or user taps to skip). Always called exactly once. */
  onComplete: () => void;
}

const DURATION_MS = 5000;
const FADE_OUT_MS = 500;

/**
 * 도쿄 도착 — cinematic opening, motion/react driven.
 *
 * Two protagonists, no clutter: the brush-wink giraffe and the title
 * "도쿄 도착". Everything else (착 kanji, hanko, droplets, sublines,
 * tagline) was cut so the two heroes can breathe.
 *
 * Storyboard (~5 s):
 *   0.0 – 0.6  Iris reveal opens cream paper from black center
 *   0.4 – 1.6  Sumi ink wash blooms from below as backdrop
 *   0.7 – 1.6  Brush-wink giraffe rises with spring overshoot
 *   1.6 – 2.6  "도쿄 도착" reveals letter-by-letter (blur + Y stagger)
 *   2.0 – 3.2  Sparkle particles burst around giraffe in waves
 *   3.2 – 4.5  Title pulse + giraffe breath cycle
 *   4.5 – 5.0  Whole scene scales up gently and fades
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
    <AnimatePresence>
      {!closing && (
        <motion.div
          role="dialog"
          aria-label="도쿄 도착"
          aria-live="polite"
          onClick={finish}
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-sumi-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: FADE_OUT_MS / 1000, ease: [0.4, 0, 0.6, 1] }}
        >
          {/* Iris reveal — cream paper opens from a center pinhole.
              clipPath drives the circle expansion; everything inside this
              wrapper only becomes visible as the iris widens. */}
          <motion.div
            className="absolute inset-0 bg-paper"
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(160% at 50% 50%)" }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          >
            {/* Sumi wash backdrop — soft halo behind the giraffe so she
                reads against the paper instead of floating. */}
            <InkBackdrop />

            {/* Sparkle particles — burst out from giraffe center. */}
            <SparkleField />

            {/* Hero stack: giraffe + title */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <GiraffeHero />
              <TitleReveal />
            </div>
          </motion.div>

          {/* Skip hint — reads even on the dark sumi backdrop pre-iris. */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-5 right-5 text-[10px] tracking-[0.35em] text-paper/60 mix-blend-difference"
          >
            TAP TO SKIP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Sumi-ink halo behind the giraffe. Replaces the previous turbulence/
 * displacement wash with a clean radial gradient that scales up — the
 * old version fought with the giraffe's silhouette.
 */
function InkBackdrop() {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      <div
        className="size-[80vmin] max-w-[680px] max-h-[680px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(28,24,21,0.18) 0%, rgba(28,24,21,0.08) 40%, rgba(28,24,21,0) 75%)",
        }}
      />
    </motion.div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

/**
 * Brush-wink giraffe. Three layered animations:
 *   1. Entry: rises from below + spring overshoot scale
 *   2. Idle breathing: subtle Y + scale loop after entry
 *   3. Glow pulse on the halo — kicks in around the title reveal
 */
function GiraffeHero() {
  return (
    <div className="relative">
      {/* Soft halo behind the giraffe — kicks in as title appears. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -m-12 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(179,50,29,0.18) 0%, rgba(179,50,29,0) 65%)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.6, 0.4, 0.6], scale: [0.6, 1.1, 1, 1.05] }}
        transition={{
          opacity: {
            times: [0, 0.4, 0.7, 1],
            duration: 2.4,
            delay: 1.6,
            repeat: Infinity,
            repeatDelay: 0.6,
          },
          scale: {
            times: [0, 0.4, 0.7, 1],
            duration: 2.4,
            delay: 1.6,
            repeat: Infinity,
            repeatDelay: 0.6,
          },
        }}
      />

      <motion.div
        initial={{ y: 80, scale: 0.4, opacity: 0, rotate: -6 }}
        animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          delay: 0.7,
          type: "spring",
          stiffness: 180,
          damping: 14,
          mass: 1,
        }}
      >
        {/* Idle breathing nested inside the entry transform so they don't
            fight (entry sets transform, breathing animates from there). */}
        <motion.div
          animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
          transition={{
            delay: 1.6,
            duration: 3.2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <Mascot variant="brush-wink" px={220} priority />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

const titleContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 1.6,
    },
  },
};

const titleLetter: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

/**
 * "도쿄 도착" reveals letter-by-letter with stagger. Each letter springs
 * up from below with a blur-to-clear transition — feels like calligraphy
 * settling into its place, not text fading in.
 */
function TitleReveal() {
  // Splitting on grapheme clusters keeps "도쿄 도착" as 5 visible glyphs
  // including the space.
  const letters = ["도", "쿄", " ", "도", "착"];

  return (
    <motion.h1
      className="font-mincho mt-8 flex font-medium text-sumi-ink"
      style={{
        fontSize: "clamp(36px, 9vw, 56px)",
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
      variants={titleContainer}
      initial="hidden"
      animate="show"
      aria-label="도쿄 도착"
    >
      {letters.map((char, i) => (
        <motion.span
          key={i}
          variants={titleLetter}
          aria-hidden
          className={i >= 3 ? "text-shu" : undefined}
          style={{
            display: "inline-block",
            minWidth: char === " " ? "0.4em" : undefined,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}

/* ───────────────────────────────────────────────────────────────────── */

// Deterministic sparkle positions — radial scatter around center.
const SPARKLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const distance = 140 + ((i * 31) % 110);
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance - 30, // bias up toward title
    size: 3 + (i % 3),
  };
});

const sparkleGroup: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 1.9 },
  },
};

const sparkle: Variants = {
  hidden: { opacity: 0, scale: 0, x: 0, y: 0 },
  show: ({ dx, dy }: { dx: number; dy: number }) => ({
    opacity: [0, 1, 0],
    scale: [0, 1.2, 0.4],
    x: dx,
    y: dy,
    transition: { duration: 1.8, ease: [0.2, 0.7, 0.3, 1] },
  }),
};

/**
 * Sparkle particles burst out from the page center as the title reveals.
 * Using a single motion parent for orchestration keeps the cascade tight
 * and lets motion handle the layout cost (vs 18 individual animation
 * declarations).
 */
function SparkleField() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2"
      variants={sparkleGroup}
      initial="hidden"
      animate="show"
    >
      {SPARKLES.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-shu"
          style={{
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            filter: "blur(0.5px)",
            boxShadow: "0 0 6px rgba(179,50,29,0.5)",
          }}
          custom={{ dx: s.dx, dy: s.dy }}
          variants={sparkle}
        />
      ))}
    </motion.div>
  );
}
