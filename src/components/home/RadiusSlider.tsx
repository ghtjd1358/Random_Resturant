"use client";

import { Footprints } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function RadiusSlider({ value, onChange }: Props) {
  const displayValue =
    value < 1000 ? `${value}m` : `${(value / 1000).toFixed(1)}km`;
  const walkMinutes = Math.round(value / 80);

  return (
    <div className="rounded-xl border border-border bg-card bg-washi-soft px-4 pt-3 pb-3.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span
            aria-hidden
            className="size-1 rounded-full bg-matcha"
          />
          검색 반경
        </label>
        <span className="font-heading text-[18px] font-bold leading-none tracking-tight text-sumi tabular-nums">
          {displayValue}
        </span>
      </div>
      <Slider
        min={300}
        max={2000}
        step={100}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        aria-label="검색 반경"
      />
      <div className="mt-2.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span className="tabular-nums">300m</span>
        <span className="flex items-center gap-1 text-matcha-deep">
          <Footprints className="size-3" />
          <span className="tabular-nums">약 {walkMinutes}분</span>
        </span>
        <span className="tabular-nums">2km</span>
      </div>
    </div>
  );
}
