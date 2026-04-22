"use client";

import { useEffect } from "react";
import Image from "next/image";
import { DiceButton } from "./DiceButton";
import { PickCard } from "./PickCard";
import { LocationBanner } from "./LocationBanner";
import { FiltersPanel } from "./FiltersPanel";
import { NoirenDivider } from "@/components/common/NoirenDivider";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocationStore } from "@/stores/useLocationStore";
import { guessRegion } from "@/lib/geo/region";

export function HomeShell() {
  useGeolocation();
  const setCategory = useFiltersStore((s) => s.setCategory);
  const coords = useLocationStore((s) => s.coords);
  const region = coords ? guessRegion(coords.lat, coords.lng) : null;

  // Apply category shortcut from PWA manifest (?c=food|cafe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("c");
    if (p === "food" || p === "cafe") setCategory(p);
  }, [setCategory]);

  return (
    <div className="px-5 pt-5 pb-6">
      <HomeHeader region={region} />

      <div className="mt-5">
        <LocationBanner />
      </div>

      <div className="mt-5">
        <FiltersPanel />
      </div>

      <section className="mt-7 flex flex-col items-center gap-5">
        <DiceButton />
        <PickCard />
      </section>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  Header — brand emblem                                                */
/* --------------------------------------------------------------------- */

function HomeHeader({ region }: { region: string | null }) {
  return (
    <header className="relative">
      {/* Top meta row: region on right, small hanko stamp accent on left */}
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          <span className="hanko size-5 text-[9px] font-bold leading-none">推</span>
          <span className="font-medium">오늘의 한 집</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-matcha" aria-hidden />
          <span className="font-medium tracking-[0.15em]">
            {region ? region : "어디서든"}
          </span>
        </div>
      </div>

      {/* Title emblem: giraffe mascot + stacked wordmark */}
      <div className="relative flex items-end gap-3">
        {/* Giraffe shop-sign mascot */}
        <div className="relative size-20 shrink-0">
          <Image
            src="/mascot-giraffe.png"
            alt="랜덤한끼 기린 셰프 마스코트"
            fill
            sizes="80px"
            priority
            className="object-contain drop-shadow-[0_2px_3px_rgba(43,43,43,0.12)]"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-end pb-0.5">
          <p
            className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-torii/80"
            aria-hidden
          >
            ここ? · 旅メシ
          </p>
          <h1 className="-translate-y-[5px] font-heading text-[2.4rem] font-bold leading-none tracking-tight text-sumi">
            랜덤<span className="text-torii">한끼</span>
          </h1>
        </div>
      </div>

      {/* Tagline with hand-drawn rule underneath */}
      <div className="mt-4 flex items-center gap-3">
        <HandDrawnRule />
        <p className="shrink-0 text-[13px] leading-none text-sumi-soft break-keep">
          <span className="text-muted-foreground">지금 내 위치에서</span>
          <span className="mx-1.5 font-heading font-bold text-sumi">한 집만</span>
          <span className="text-muted-foreground">, 고민 없이…!</span>
        </p>
        <HandDrawnRule flipped />
      </div>

      <NoirenDivider className="mt-4 opacity-80" />
    </header>
  );
}

/* --------------------------------------------------------------------- */
/*  Hand-drawn rule — fading ink line beside tagline                     */
/* --------------------------------------------------------------------- */

function HandDrawnRule({ flipped }: { flipped?: boolean }) {
  return (
    <span
      aria-hidden
      className="h-px flex-1 rounded-full"
      style={{
        backgroundImage: flipped
          ? "linear-gradient(90deg, transparent 0%, var(--color-border) 60%, var(--color-sumi-soft) 100%)"
          : "linear-gradient(90deg, var(--color-sumi-soft) 0%, var(--color-border) 40%, transparent 100%)",
      }}
    />
  );
}
