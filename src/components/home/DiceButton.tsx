"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useLocationStore } from "@/stores/useLocationStore";
import { useDiceStyleStore } from "@/stores/useDiceStyleStore";
import { useRoll } from "@/hooks/useRoll";
import { useDiceSpin } from "@/hooks/useDiceSpin";

export function DiceButton() {
  const status = useSessionStore((s) => s.status);
  const hasPick = useSessionStore((s) => s.currentPick !== null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const hasLocation = useLocationStore((s) => s.coords !== null);
  const category = useFiltersStore((s) => s.category);
  const diceStyle = useDiceStyleStore((s) => s.style);
  const { roll, reveal } = useRoll();
  const { glyph, controls, phaseText, spin, isSpinning } = useDiceSpin(category);

  // In rotating style, the cycling kanji takes over while spinning. When idle
  // (and in classic style always), the signature 選 sits in the center.
  const displayGlyph =
    diceStyle === "rotating" && isSpinning ? glyph : "選";

  const disabled = !hasLocation || isSpinning || status === "rolling";
  const idleHelp = hasPick ? "다시 굴리기" : "맡겨주세요";

  const handleClick = async () => {
    if (disabled) return;
    haptic.rollStart();
    setCurrentPick(null);
    const pick = await spin(roll);
    reveal(pick ?? null);
    haptic.rollEnd();
  };

  const helperText = isSpinning ? (phaseText ?? "고르는 중") : idleHelp;

  return (
    <div className="relative flex flex-col items-center">
      <p className="eyebrow mb-3">탭해서 굴리기</p>

      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.96 }}
        aria-label={idleHelp}
        className={cn(
          "no-select relative flex size-36 items-center justify-center rounded-full",
          "bg-sumi-ink text-paper transition-opacity duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        style={{
          boxShadow: disabled
            ? "0 2px 4px rgba(28, 24, 21, 0.1)"
            : "0 2px 3px rgba(28, 24, 21, 0.15), 0 18px 32px -14px rgba(28, 24, 21, 0.4)",
        }}
      >
        {/* 朱 dot — small accent at upper-right */}
        <span
          aria-hidden
          className="absolute right-4 top-4 size-1.5 rounded-full bg-shu"
        />

        <motion.span
          animate={controls}
          initial={{ scale: 1 }}
          className="font-mincho text-[3.5rem] font-medium leading-none text-paper"
          style={{ display: "inline-block" }}
        >
          {displayGlyph}
        </motion.span>
      </motion.button>

      <p
        className={cn(
          "mt-3 font-mincho text-[12px] tracking-tight transition-opacity",
          isSpinning ? "text-sumi-ink" : "text-sumi-mute",
        )}
      >
        {helperText}
      </p>
    </div>
  );
}
