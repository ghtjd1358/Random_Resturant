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
      <DrawerContent className="mx-auto max-w-[480px] bg-paper">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-mincho text-[1.5rem] font-medium tracking-tight text-sumi-ink">
            지역 선택
          </DrawerTitle>
          <DrawerDescription className="text-sumi-fade">
            위치 권한 없이도 여행지 핫플에서 바로 굴릴 수 있어요.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-5 pb-6">
          {groups.map(({ city, cityKanji, items }) => (
            <section key={city}>
              <div className="mb-2 flex items-baseline gap-2 border-b border-hairline-soft pb-2">
                <span className="font-mincho text-[14px] font-medium text-sumi-ink">
                  {cityKanji}
                </span>
                <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
                  {city}
                </span>
                <span className="ml-auto eyebrow text-[9px] num-tabular">
                  {String(items.length).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {items.map((p) => {
                  const active = p.id === presetId;
                  return (
                    <DrawerClose asChild key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className={cn(
                          "flex items-center gap-2 border px-2.5 py-2 text-left transition-colors",
                          active
                            ? "border-sumi-ink bg-sumi-ink text-paper"
                            : "border-hairline bg-paper text-sumi-ink hover:border-sumi-ink/40",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center border font-mincho text-[13px] font-medium leading-none",
                            active
                              ? "border-paper/40 text-paper"
                              : "border-sumi-ink text-sumi-ink",
                          )}
                        >
                          {p.kanji}
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span
                            className={cn(
                              "truncate font-mincho text-[13px] font-medium tracking-tight",
                              active ? "text-paper" : "text-sumi-ink",
                            )}
                          >
                            {p.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] num-tabular",
                              active ? "text-paper/60" : "text-sumi-fade",
                            )}
                          >
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
