"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { useSessionStore } from "@/stores/useSessionStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useLocationStore } from "@/stores/useLocationStore";
import { useRoll } from "@/hooks/useRoll";
import { useDiceSpin } from "@/hooks/useDiceSpin";

export function DiceButton() {
  const status = useSessionStore((s) => s.status);
  const hasPick = useSessionStore((s) => s.currentPick !== null);
  const setCurrentPick = useSessionStore((s) => s.setCurrentPick);
  const hasLocation = useLocationStore((s) => s.coords !== null);
  const category = useFiltersStore((s) => s.category);
  const { roll, reveal } = useRoll();
  const { emoji, controls, phaseText, spin, isSpinning } = useDiceSpin(category);

  const disabled = !hasLocation || isSpinning || status === "rolling";
  const idleLabel = hasPick ? "다시 뽑기" : "한 집 뽑기";

  const handleClick = async () => {
    if (disabled) return;
    haptic.rollStart();
    setCurrentPick(null);
    const pick = await spin(roll);
    reveal(pick ?? null);
    haptic.rollEnd();
  };

  const label = isSpinning ? (phaseText ?? "고르는 중") : idleLabel;

  return (
    <div className="relative flex flex-col items-center">
      {/* Outer aura rings — layered concentric, ensō-inspired */}
      <div className="relative flex size-56 items-center justify-center">
        <span
          aria-hidden
          className="absolute size-56 rounded-full border border-torii/12"
        />
        <span
          aria-hidden
          className="absolute size-52 rounded-full border border-dashed border-torii/20"
        />
        <span
          aria-hidden
          className="absolute size-48 rounded-full border border-torii/8"
        />

        {/* Warm halo behind button */}
        <span
          aria-hidden
          className="absolute size-48 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(200, 16, 46, 0.22) 0%, rgba(200, 16, 46, 0) 70%)",
          }}
        />

        <motion.button
          onClick={handleClick}
          disabled={disabled}
          whileTap={{ scale: 0.94 }}
          aria-label={idleLabel}
          className={cn(
            "no-select group relative flex size-44 items-center justify-center rounded-full",
            "bg-gradient-to-br from-torii-soft via-torii to-torii-deep text-cream",
            "transition-[opacity,box-shadow] duration-200",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // Inner highlight ring (makes it look like a polished stone)
            "before:absolute before:inset-[6px] before:rounded-full before:pointer-events-none",
            "before:bg-gradient-to-b before:from-white/28 before:via-transparent before:to-black/10",
            // Outer thin ring (sharpens the button edge against warm bg)
            "after:absolute after:inset-[-3px] after:rounded-full after:pointer-events-none",
            "after:border after:border-torii-deep/20",
          )}
          style={{
            boxShadow: disabled
              ? "0 2px 4px rgba(43, 43, 43, 0.08)"
              : "0 2px 3px rgba(43, 43, 43, 0.12), 0 12px 28px -8px rgba(200, 16, 46, 0.5), 0 22px 48px -14px rgba(200, 16, 46, 0.35), inset 0 -4px 10px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.18)",
          }}
        >
          {/* Inner decorative ring — torii red pattern */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-full border border-cream/15"
          />

          <div className="relative flex flex-col items-center gap-1.5">
            <motion.span
              animate={controls}
              initial={{ scale: 1 }}
              className="text-[3.2rem] leading-none"
              style={{
                display: "inline-block",
                filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25))",
              }}
            >
              {emoji}
            </motion.span>
            <span className="min-h-[1.5rem] font-heading text-[14px] font-bold tracking-wider text-cream transition-opacity duration-200">
              {label}
            </span>
          </div>
        </motion.button>

        {/* Soft ground shadow beneath button */}
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-torii/25 blur-xl"
        />
      </div>

      {/* Small service mark below */}
      {!isSpinning && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          <span className="size-1 rounded-full bg-torii/60" aria-hidden />
          tap to roll
          <span className="size-1 rounded-full bg-torii/60" aria-hidden />
        </p>
      )}
    </div>
  );
}
