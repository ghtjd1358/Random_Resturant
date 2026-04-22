"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { Category, Subcategory } from "@/lib/places/types";
import { subcategoriesFor } from "@/lib/places/types";

interface Props {
  category: Category;
  value: Subcategory;
  onChange: (s: Subcategory) => void;
}

export function SubcategoryChips({ category, value, onChange }: Props) {
  const options = subcategoriesFor(category);

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="radiogroup" aria-label="세부 카테고리" className="flex gap-2">
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (!active) haptic.select();
                onChange(opt.key);
              }}
              className={cn(
                "no-select relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "text-cream"
                  : "border border-border bg-card text-muted-foreground hover:text-sumi",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`subcat-${category}-active`}
                  className="absolute inset-0 rounded-full bg-sumi shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <span className="text-sm leading-none">{opt.emoji}</span>
                <span>{opt.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
