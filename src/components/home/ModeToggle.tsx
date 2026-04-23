"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import type { PickMode } from "@/lib/places/score";
import { FilterSectionHeader } from "./FilterSectionHeader";

interface Props {
  value: PickMode;
  onChange: (m: PickMode) => void;
}

const MODES: {
  key: PickMode;
  label: string;
  caption: string;
  badge: string;
}[] = [
  { key: "popular", label: "검증된 곳", caption: "평점 높고 리뷰 많은", badge: "POPULAR" },
  { key: "discovery", label: "숨은 곳", caption: "아는 사람만 가는", badge: "HIDDEN" },
];

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div>
      <FilterSectionHeader kanji="好" labelKr="취향" labelEn="MOOD" />
      <div role="radiogroup" aria-label="추천 방식" className="grid grid-cols-2 gap-2">
        {MODES.map(({ key, label, caption, badge }) => {
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
                "no-select relative flex flex-col items-start border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-sumi-ink bg-paper-soft"
                  : "border-hairline bg-paper hover:border-sumi-ink/40",
              )}
            >
              {active && <span aria-hidden className="shu-tab" />}
              <span
                className={cn(
                  "eyebrow text-[9px]",
                  active ? "text-sumi-mute" : "text-sumi-fade",
                )}
              >
                {badge}
              </span>
              <span className="font-mincho mt-1 text-[14px] font-medium tracking-tight text-sumi-ink">
                {label}
              </span>
              <span className="font-mincho mt-0.5 text-[10px] text-sumi-fade">
                {caption}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
