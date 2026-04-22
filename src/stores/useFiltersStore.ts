"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, PriceBucket, Subcategory } from "@/lib/places/types";
import type { PickMode } from "@/lib/places/score";

interface FiltersState {
  category: Category;
  subcategory: Subcategory;
  radius: number;
  openNowOnly: boolean;
  mode: PickMode;
  /** Allowed price buckets. Empty = no price preference (all allowed). */
  priceLevels: PriceBucket[];
  setCategory: (c: Category) => void;
  setSubcategory: (s: Subcategory) => void;
  setRadius: (r: number) => void;
  setOpenNowOnly: (v: boolean) => void;
  setMode: (m: PickMode) => void;
  togglePriceLevel: (p: PriceBucket) => void;
  clearPriceLevels: () => void;
  resetFilters: () => void;
}

/**
 * Default filter snapshot — also used by the reset button and the
 * `isFiltersDefault` selector to decide whether to surface the
 * "기본값으로" pill.
 */
export const DEFAULT_FILTERS = {
  category: "food" as Category,
  subcategory: "all-food" as Subcategory,
  radius: 800,
  openNowOnly: false,
  mode: "popular" as PickMode,
  priceLevels: [] as PriceBucket[],
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_FILTERS,
      setCategory: (category) =>
        set({
          category,
          subcategory: category === "food" ? "all-food" : "all-cafe",
        }),
      setSubcategory: (subcategory) => set({ subcategory }),
      setRadius: (radius) => set({ radius }),
      setOpenNowOnly: (openNowOnly) => set({ openNowOnly }),
      setMode: (mode) => set({ mode }),
      togglePriceLevel: (p) =>
        set((state) => ({
          priceLevels: state.priceLevels.includes(p)
            ? state.priceLevels.filter((x) => x !== p)
            : [...state.priceLevels, p],
        })),
      clearPriceLevels: () => set({ priceLevels: [] }),
      resetFilters: () => set({ ...DEFAULT_FILTERS }),
    }),
    { name: "rr-filters" },
  ),
);

/** True when every field matches DEFAULT_FILTERS. Used to hide the reset pill. */
export function isFiltersDefault(s: FiltersState): boolean {
  return (
    s.category === DEFAULT_FILTERS.category &&
    s.subcategory === DEFAULT_FILTERS.subcategory &&
    s.radius === DEFAULT_FILTERS.radius &&
    s.openNowOnly === DEFAULT_FILTERS.openNowOnly &&
    s.mode === DEFAULT_FILTERS.mode &&
    s.priceLevels.length === 0
  );
}
