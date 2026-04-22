"use client";

import { motion } from "motion/react";
import { UtensilsCrossed, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { Category } from "@/lib/places/types";

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

const OPTIONS: { key: Category; label: string; icon: typeof Coffee }[] = [
  { key: "food", label: "밥집", icon: UtensilsCrossed },
  { key: "cafe", label: "카페", icon: Coffee },
];

export function CategoryToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="카테고리 선택"
      className="relative grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1"
    >
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (value !== key) haptic.select();
              onChange(key);
            }}
            className={cn(
              "no-select relative flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "text-cream" : "text-muted-foreground hover:text-sumi",
            )}
          >
            {active && (
              <motion.span
                layoutId="category-active"
                className={cn(
                  "absolute inset-0 rounded-lg shadow-sm",
                  key === "cafe" ? "bg-matcha" : "bg-sumi",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="size-4 text-gold" />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
