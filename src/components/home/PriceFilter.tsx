"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { PRICE_BUCKETS, type PriceBucket } from "@/lib/places/types";

interface Props {
  value: PriceBucket[];
  onToggle: (p: PriceBucket) => void;
  onClear: () => void;
}

export function PriceFilter({ value, onToggle, onClear }: Props) {
  const allActive = value.length === 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          if (!allActive) {
            haptic.select();
            onClear();
          }
        }}
        className={cn(
          "no-select relative flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          allActive
            ? "text-cream"
            : "border border-border bg-card text-muted-foreground hover:text-sumi",
        )}
      >
        {allActive && (
          <motion.span
            layoutId="price-active"
            className="absolute inset-0 rounded-full bg-sumi shadow-sm"
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          />
        )}
        <span className="relative">전체</span>
      </button>

      <div className="flex flex-1 gap-1.5">
        {PRICE_BUCKETS.map(({ key, label, description }) => {
          const active = !allActive && value.includes(key);
          return (
            <button
              key={key}
              onClick={() => {
                haptic.select();
                onToggle(key);
              }}
              aria-pressed={active}
              aria-label={`${label} · ${description}`}
              className={cn(
                "no-select flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium transition-all",
                active
                  ? "bg-matcha text-cream shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-sumi",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
