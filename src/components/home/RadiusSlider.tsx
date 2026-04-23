"use client";

import { Slider } from "@/components/ui/slider";
import { FilterSectionHeader } from "./FilterSectionHeader";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function RadiusSlider({ value, onChange }: Props) {
  const displayValue =
    value < 1000 ? `${value} m` : `${(value / 1000).toFixed(1)} km`;
  const walkMinutes = Math.round(value / 80);

  return (
    <div>
      <FilterSectionHeader
        kanji="圏"
        labelKr="거리"
        labelEn="RADIUS"
        trailing={
          <span className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink num-tabular">
            {displayValue}
          </span>
        }
      />
      <Slider
        min={300}
        max={2000}
        step={100}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        aria-label="검색 반경"
      />
      <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-sumi-fade num-tabular">
        <span>300m</span>
        <span>500m</span>
        <span>1km</span>
        <span>2km · 약 {walkMinutes}분</span>
      </div>
    </div>
  );
}
