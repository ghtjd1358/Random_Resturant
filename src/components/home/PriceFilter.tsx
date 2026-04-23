"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { PRICE_BUCKETS, type PriceBucket } from "@/lib/places/types";
import { FilterSectionHeader } from "./FilterSectionHeader";

interface Props {
  value: PriceBucket[];
  onToggle: (p: PriceBucket) => void;
  onClear: () => void;
}

export function PriceFilter({ value, onToggle, onClear }: Props) {
  const allActive = value.length === 0;

  return (
    <div>
      <FilterSectionHeader kanji="價" labelKr="예산" labelEn="PRICE" />
      <div className="grid grid-cols-5 gap-1.5">
        <PriceCell
          symbol="全"
          caption="전체"
          active={allActive}
          accent
          onClick={() => {
            if (!allActive) {
              haptic.select();
              onClear();
            }
          }}
        />
        {PRICE_BUCKETS.map(({ key, description }) => {
          const active = !allActive && value.includes(key);
          return (
            <PriceCell
              key={key}
              symbol={key}
              caption={description}
              active={active}
              onClick={() => {
                haptic.select();
                onToggle(key);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PriceCell({
  symbol,
  caption,
  active,
  accent = false,
  onClick,
}: {
  symbol: string;
  caption: string;
  active: boolean;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "no-select flex flex-col items-center justify-center gap-0.5 border py-2 transition-colors",
        active
          ? accent
            ? "border-shu bg-shu text-paper"
            : "border-sumi-ink bg-sumi-ink text-paper"
          : "border-hairline bg-paper text-sumi-ink hover:border-sumi-ink/40",
      )}
    >
      <span className="font-mincho text-[14px] font-medium leading-none">
        {symbol}
      </span>
      <span
        className={cn(
          "font-mincho text-[9px] tracking-tight",
          active ? "text-paper/65" : "text-sumi-fade",
        )}
      >
        {caption}
      </span>
    </button>
  );
}
