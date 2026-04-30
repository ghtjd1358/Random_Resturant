"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { Category, Subcategory } from "@/lib/places/types";
import { subcategoriesFor } from "@/lib/places/types";

interface Props {
  category: Category;
  value: Subcategory;
  onChange: (s: Subcategory) => void;
}

// Korean label → kanji glyph for the editorial chip system.
const KANJI: Partial<Record<Subcategory, string>> = {
  "all-food": "全",
  ramen: "拉麵",
  sushi: "鮨",
  japanese: "和",
  izakaya: "居",
  steak: "焼",
  seafood: "海",
  fastfood: "速",
  "all-cafe": "全",
  coffee: "珈",
  dessert: "菓",
  bakery: "麭",
  "all-bar": "全",
  pub: "麦",
  "wine-bar": "葡",
  cocktail: "杯",
  "night-club": "夜",
};

export function SubcategoryChips({ category, value, onChange }: Props) {
  const options = subcategoriesFor(category);

  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="radiogroup" aria-label="세부 카테고리" className="flex gap-1.5">
        {options.map((opt) => {
          const active = value === opt.key;
          const kanji = KANJI[opt.key];
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
                "no-select relative flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[12px] transition-colors",
                active
                  ? "border-sumi-ink bg-sumi-ink text-paper"
                  : "border-hairline bg-paper text-sumi-ink hover:border-sumi-ink/40",
              )}
            >
              <span className="font-mincho font-medium tracking-tight">
                {opt.label}
              </span>
              {kanji && (
                <span
                  className={cn(
                    "font-mincho text-[10px]",
                    active ? "text-paper/55" : "text-sumi-fade",
                  )}
                >
                  {kanji}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
