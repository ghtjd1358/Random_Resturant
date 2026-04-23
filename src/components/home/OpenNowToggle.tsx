"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { FilterSectionHeader } from "./FilterSectionHeader";

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function OpenNowToggle({ value, onChange }: Props) {
  const handle = () => {
    haptic.select();
    onChange(!value);
  };

  return (
    <div>
      <FilterSectionHeader kanji="營" labelKr="영업" labelEn="OPEN" />
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={handle}
        className="no-select flex w-full items-center justify-between border-y border-hairline-soft py-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
            지금 열린 곳만
          </p>
          <p className="mt-0.5 text-[11px] text-sumi-fade">
            닫은 곳은 안 보이게
          </p>
        </div>
        <span
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            value ? "bg-sumi-ink" : "bg-hairline",
          )}
        >
          <span
            className={cn(
              "absolute inline-block size-4 rounded-full bg-paper transition-transform",
              value ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </span>
      </button>
    </div>
  );
}
