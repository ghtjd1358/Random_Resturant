"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { Category } from "@/lib/places/types";

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

const OPTIONS: { key: Category; label: string; kanji: string }[] = [
  { key: "food", label: "밥집", kanji: "食事" },
  { key: "cafe", label: "카페", kanji: "喫茶" },
  { key: "bar", label: "술집", kanji: "酒場" },
];

export function CategoryToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="카테고리 선택"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map(({ key, label, kanji }) => {
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
              "no-select relative flex flex-col items-center justify-center gap-0.5 border px-4 py-3 transition-colors",
              active
                ? "border-sumi-ink bg-sumi-ink text-paper"
                : "border-hairline bg-paper text-sumi-ink hover:border-sumi-ink/40",
            )}
          >
            <span className="font-mincho text-[15px] font-medium tracking-tight">
              {label}
            </span>
            <span
              className={cn(
                "font-mincho text-[10px] tracking-[0.15em]",
                active ? "text-paper/60" : "text-sumi-fade",
              )}
            >
              {kanji}
            </span>
          </button>
        );
      })}
    </div>
  );
}
