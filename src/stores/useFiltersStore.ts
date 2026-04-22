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
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      category: "food",
      subcategory: "all-food",
      radius: 800,
      openNowOnly: false,
      mode: "popular",
      priceLevels: [], // empty = all allowed
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
    }),
    { name: "rr-filters" },
  ),
);
