"use client";

import { RotateCcw } from "lucide-react";
import { CategoryToggle } from "./CategoryToggle";
import { SubcategoryChips } from "./SubcategoryChips";
import { ModeToggle } from "./ModeToggle";
import { PriceFilter } from "./PriceFilter";
import { RadiusSlider } from "./RadiusSlider";
import { OpenNowToggle } from "./OpenNowToggle";
import { haptic } from "@/lib/haptic";
import { isFiltersDefault, useFiltersStore } from "@/stores/useFiltersStore";

/**
 * Bundle of all filter controls. Kept flat — no nested dividers or labels —
 * so the home page reads as a single tidy stack.
 */
export function FiltersPanel() {
  const category = useFiltersStore((s) => s.category);
  const subcategory = useFiltersStore((s) => s.subcategory);
  const mode = useFiltersStore((s) => s.mode);
  const radius = useFiltersStore((s) => s.radius);
  const openNowOnly = useFiltersStore((s) => s.openNowOnly);
  const priceLevels = useFiltersStore((s) => s.priceLevels);
  const atDefault = useFiltersStore(isFiltersDefault);

  const setCategory = useFiltersStore((s) => s.setCategory);
  const setSubcategory = useFiltersStore((s) => s.setSubcategory);
  const setMode = useFiltersStore((s) => s.setMode);
  const setRadius = useFiltersStore((s) => s.setRadius);
  const setOpenNowOnly = useFiltersStore((s) => s.setOpenNowOnly);
  const togglePriceLevel = useFiltersStore((s) => s.togglePriceLevel);
  const clearPriceLevels = useFiltersStore((s) => s.clearPriceLevels);
  const resetFilters = useFiltersStore((s) => s.resetFilters);

  return (
    <div className="flex flex-col gap-3">
      {!atDefault && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              haptic.tap();
              resetFilters();
            }}
            className="no-select flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-torii/40 hover:text-torii"
          >
            <RotateCcw className="size-3" strokeWidth={2} />
            기본값으로
          </button>
        </div>
      )}
      <CategoryToggle value={category} onChange={setCategory} />
      <SubcategoryChips
        category={category}
        value={subcategory}
        onChange={setSubcategory}
      />
      <ModeToggle value={mode} onChange={setMode} />
      <PriceFilter
        value={priceLevels}
        onToggle={togglePriceLevel}
        onClear={clearPriceLevels}
      />
      <RadiusSlider value={radius} onChange={setRadius} />
      <OpenNowToggle value={openNowOnly} onChange={setOpenNowOnly} />
    </div>
  );
}
