"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CategoryToggle } from "./CategoryToggle";
import { SubcategoryChips } from "./SubcategoryChips";
import { ModeToggle } from "./ModeToggle";
import { PriceFilter } from "./PriceFilter";
import { RadiusSlider } from "./RadiusSlider";
import { OpenNowToggle } from "./OpenNowToggle";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { cn } from "@/lib/utils";

/**
 * Editorial filter stack: category + subcategory chips on top, a one-line
 * status summary below, and the detailed controls (mode/price/radius/open)
 * tucked behind a 더 자세히 toggle to keep the masthead breathing.
 */
export function FiltersPanel() {
  const [expanded, setExpanded] = useState(false);

  const category = useFiltersStore((s) => s.category);
  const subcategory = useFiltersStore((s) => s.subcategory);
  const mode = useFiltersStore((s) => s.mode);
  const radius = useFiltersStore((s) => s.radius);
  const openNowOnly = useFiltersStore((s) => s.openNowOnly);
  const priceLevels = useFiltersStore((s) => s.priceLevels);

  const setCategory = useFiltersStore((s) => s.setCategory);
  const setSubcategory = useFiltersStore((s) => s.setSubcategory);
  const setMode = useFiltersStore((s) => s.setMode);
  const setRadius = useFiltersStore((s) => s.setRadius);
  const setOpenNowOnly = useFiltersStore((s) => s.setOpenNowOnly);
  const togglePriceLevel = useFiltersStore((s) => s.togglePriceLevel);
  const clearPriceLevels = useFiltersStore((s) => s.clearPriceLevels);

  return (
    <div className="flex flex-col gap-3">
      <CategoryToggle value={category} onChange={setCategory} />
      <SubcategoryChips
        category={category}
        value={subcategory}
        onChange={setSubcategory}
      />

      <SummaryLine
        radius={radius}
        priceLevels={priceLevels}
        openNowOnly={openNowOnly}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-hairline-soft pt-3">
          <ModeToggle value={mode} onChange={setMode} />
          <PriceFilter
            value={priceLevels}
            onToggle={togglePriceLevel}
            onClear={clearPriceLevels}
          />
          <RadiusSlider value={radius} onChange={setRadius} />
          <OpenNowToggle value={openNowOnly} onChange={setOpenNowOnly} />
        </div>
      )}
    </div>
  );
}

function SummaryLine({
  radius,
  priceLevels,
  openNowOnly,
  expanded,
  onToggle,
}: {
  radius: number;
  priceLevels: ReturnType<typeof useFiltersStore.getState>["priceLevels"];
  openNowOnly: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const radiusLabel = radius >= 1000 ? `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)} km` : `${radius} m`;
  const priceLabel = priceLevelsToLabel(priceLevels);

  return (
    <div className="flex items-center gap-3 pt-1">
      <Stat label="RADIUS" value={radiusLabel} />
      <Stat label="PRICE" value={priceLabel} />
      <Stat label="OPEN" value={openNowOnly ? "営業中" : "全て"} />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-medium text-shu transition-opacity hover:opacity-70"
      >
        {expanded ? "닫기" : "더 자세히"}
        <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="eyebrow text-[9px]">{label}</span>
      <span className="font-mincho text-[12px] font-medium text-sumi-ink num-tabular">
        {value}
      </span>
    </div>
  );
}

function priceLevelsToLabel(levels: ReturnType<typeof useFiltersStore.getState>["priceLevels"]): string {
  if (!levels || levels.length === 0) return "全て";
  const symbols: Record<string, string> = {
    PRICE_LEVEL_INEXPENSIVE: "¥",
    PRICE_LEVEL_MODERATE: "¥¥",
    PRICE_LEVEL_EXPENSIVE: "¥¥¥",
    PRICE_LEVEL_VERY_EXPENSIVE: "¥¥¥¥",
  };
  return levels
    .map((l) => symbols[l] ?? "¥")
    .filter((v, i, a) => a.indexOf(v) === i)
    .join("·");
}
