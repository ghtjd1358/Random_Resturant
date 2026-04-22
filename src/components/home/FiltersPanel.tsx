"use client";

import { CategoryToggle } from "./CategoryToggle";
import { SubcategoryChips } from "./SubcategoryChips";
import { ModeToggle } from "./ModeToggle";
import { PriceFilter } from "./PriceFilter";
import { RadiusSlider } from "./RadiusSlider";
import { OpenNowToggle } from "./OpenNowToggle";
import { useFiltersStore } from "@/stores/useFiltersStore";

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
