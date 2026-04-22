"use client";

import type { ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  presetsByCity,
  type LocationPreset,
} from "@/lib/geo/presets";
import { useLocationStore } from "@/stores/useLocationStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

export function PresetSheet({ children }: { children: ReactNode }) {
  const presetId = useLocationStore((s) => s.presetId);
  const setPreset = useLocationStore((s) => s.setPreset);
  const setRadius = useFiltersStore((s) => s.setRadius);
  const groups = presetsByCity();

  const handleSelect = (p: LocationPreset) => {
    haptic.tap();
    setPreset(p);
    setRadius(p.defaultRadius);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto max-w-[480px]">
        <DrawerHeader>
          <DrawerTitle>지역 선택</DrawerTitle>
          <DrawerDescription>
            위치 권한 없이도 여행지 핫플에서 바로 굴릴 수 있어요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 pb-6">
          {groups.map(({ city, items }) => (
            <section key={city}>
              <h3 className="mb-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {city}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((p) => {
                  const active = p.id === presetId;
                  return (
                    <DrawerClose asChild key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          active
                            ? "border-matcha/60 bg-matcha/10"
                            : "border-border/60 bg-card hover:bg-muted/50",
                        )}
                      >
                        <span aria-hidden className="mt-0.5 text-base leading-none">
                          {p.emoji ?? "📍"}
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-heading text-[13px] font-bold leading-tight">
                            {p.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            반경 {p.defaultRadius}m
                          </span>
                        </div>
                      </button>
                    </DrawerClose>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
