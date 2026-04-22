"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { ActionBar } from "./ActionBar";
import { PickCardBody } from "./PickCardBody";
import { decorEmojiFor } from "@/lib/format/place";

export function PickCard() {
  const pick = useSessionStore((s) => s.currentPick);
  const status = useSessionStore((s) => s.status);
  const category = useFiltersStore((s) => s.category);

  return (
    <div className="min-h-[260px] w-full">
      <AnimatePresence mode="wait">
        {pick ? (
          <motion.article
            key={pick.id}
            initial={{ y: 24, opacity: 0, scale: 0.95, rotate: -0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            exit={{ y: -18, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-card bg-washi-soft shadow-[0_1px_2px_rgba(43,43,43,0.04),0_12px_28px_-8px_rgba(43,43,43,0.16),0_24px_48px_-16px_rgba(200,16,46,0.1)]"
          >
            {/* Top accent ribbon — braided two-tone */}
            <div className="relative h-1.5 w-full">
              <div
                className={`absolute inset-0 ${
                  category === "cafe"
                    ? "bg-gradient-to-r from-matcha-deep via-matcha to-matcha-deep"
                    : "bg-gradient-to-r from-torii-deep via-torii to-torii-deep"
                }`}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(250, 246, 238, 0.35) 0 2px, transparent 2px 8px)",
                }}
              />
            </div>

            {/* Decorative food emoji watermark — top-right corner */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-3 -top-3 rotate-12 select-none text-[7rem] leading-none opacity-[0.09]"
            >
              {decorEmojiFor(pick.primaryType, category)}
            </div>

            <PickCardBody pick={pick} />

            {/* Decorative perforation line above action bar */}
            <div
              aria-hidden
              className="mx-5 border-t border-dashed border-border/60"
            />

            <ActionBar place={pick} />
          </motion.article>
        ) : (
          <Placeholder rolling={status === "rolling"} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function Placeholder({ rolling }: { rolling: boolean }) {
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/40 bg-washi-soft px-6 py-12 text-center"
    >
      <CornerTick position="top-left" />
      <CornerTick position="top-right" />
      <CornerTick position="bottom-left" />
      <CornerTick position="bottom-right" />

      <p className="text-sm leading-relaxed text-muted-foreground break-keep">
        {rolling ? (
          <>
            <span className="font-heading font-bold text-sumi-soft">고르는 중…</span>
            <br />
            <span className="text-[12px] text-muted-foreground/80">
              평점·거리·취향을 따져보는 중이에요
            </span>
          </>
        ) : (
          <>
            <span className="font-heading text-[15px] font-bold text-sumi-soft">
              위의 주사위를 굴려보세요.
            </span>
            <br />
            <span className="mt-1 block text-[12px] text-muted-foreground/80">
              현지 평점 높은 한 집이 나와요.
            </span>
          </>
        )}
      </p>
    </motion.div>
  );
}

function CornerTick({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const positionClasses = {
    "top-left": "top-3 left-3 border-t border-l",
    "top-right": "top-3 right-3 border-t border-r",
    "bottom-left": "bottom-3 left-3 border-b border-l",
    "bottom-right": "bottom-3 right-3 border-b border-r",
  }[position];
  return (
    <span
      aria-hidden
      className={`absolute size-3 border-border/60 ${positionClasses}`}
    />
  );
}
