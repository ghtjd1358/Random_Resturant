"use client";

import { motion } from "motion/react";
import { Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { PickMode } from "@/lib/places/score";

interface Props {
  value: PickMode;
  onChange: (m: PickMode) => void;
}

const MODES: { key: PickMode; label: string; description: string; icon: typeof Trophy }[] = [
  { key: "popular", label: "검증된 곳", description: "리뷰 많은 인기집", icon: Trophy },
  { key: "discovery", label: "숨은 맛집", description: "리뷰 적은 로컬 발견", icon: Sparkles },
];

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="추천 방식"
      className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1"
    >
      {MODES.map(({ key, label, description, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (!active) haptic.select();
              onChange(key);
            }}
            className={cn(
              "no-select relative flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
              active ? "text-cream" : "text-muted-foreground hover:text-sumi",
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-active"
                className={cn(
                  "absolute inset-0 rounded-lg shadow-sm",
                  key === "discovery" ? "bg-matcha" : "bg-sumi",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="size-3.5 text-gold" strokeWidth={2} />
              <span className="text-sm font-medium">{label}</span>
            </span>
            <span className="relative text-[10px] opacity-80">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
