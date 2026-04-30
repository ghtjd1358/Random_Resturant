"use client";

import { useEffect, useState } from "react";
import { DiceButton } from "./DiceButton";
import { PickCard } from "./PickCard";
import { LocationBanner } from "./LocationBanner";
import { FiltersPanel } from "./FiltersPanel";
import Image from "next/image";
import { TokyoArrival } from "./TokyoArrival";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLocationStore } from "@/stores/useLocationStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTokyoArrivalStore } from "@/stores/useTokyoArrivalStore";
import { isInTokyo } from "@/lib/geo/region";

export function HomeShell() {
  useGeolocation();
  const setCategory = useFiltersStore((s) => s.setCategory);
  const pickedCount = useSessionStore((s) => s.lastPickedIds.length);
  // Editorial issue number — increments per pick from 042. Keeps the
  // newspaper-style accent stable across renders without leaking Date.now()
  // (hydration friendly).
  const issueNo = String(42 + pickedCount).padStart(3, "0");

  // 도쿄 도착 easter egg — auto-plays once per device when coords land in Tokyo.
  const seal = useTokyoArrivalStore((s) => s.seal);
  const [playing, setPlaying] = useState(() => {
    if (typeof window === "undefined") return false;
    const initial = useLocationStore.getState().coords;
    if (!initial || useTokyoArrivalStore.getState().sealed) return false;
    return isInTokyo(initial.lat, initial.lng);
  });
  useEffect(() => {
    // Subscribe for later coord changes (preset switches, GPS updates).
    return useLocationStore.subscribe((next, prev) => {
      if (next.coords === prev.coords || !next.coords) return;
      if (useTokyoArrivalStore.getState().sealed) return;
      if (isInTokyo(next.coords.lat, next.coords.lng)) setPlaying(true);
    });
  }, []);

  // Apply category shortcut from PWA manifest (?c=food|cafe|bar)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("c");
    if (p === "food" || p === "cafe" || p === "bar") setCategory(p);
  }, [setCategory]);

  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="選" />
      {/* Wrap interactive content in z-10 so it sits above the watermark */}
      <div className="relative z-10">
      {playing && (
        <TokyoArrival
          onComplete={() => {
            seal();
            setPlaying(false);
          }}
        />
      )}
      <HomeHeader issueNo={issueNo} />

      <div className="mt-4">
        <LocationBanner />
      </div>

      <div className="mt-4">
        <FiltersPanel />
      </div>

      <section className="mt-8 flex flex-col items-center gap-6">
        <DiceButton />
        <PickCard />
      </section>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  Header — editorial masthead (日本ミニマル)                           */
/* --------------------------------------------------------------------- */

function HomeHeader({ issueNo }: { issueNo: string }) {
  return (
    <header className="relative">
      {/* Eyebrow row: 選 hanko + KR/JP label · N° issue number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="hanko-square hanko-square-shu"
            aria-hidden
          >
            選
          </span>
          <span className="eyebrow-strong">
            오늘 뭐 먹지
            <span className="mx-1.5 text-sumi-fade/60">/</span>
            <span className="text-sumi-fade">TODAY&apos;S PICK</span>
          </span>
        </div>
        <span className="eyebrow num-tabular">N° {issueNo}</span>
      </div>

      {/* Title row: face mascot + wordmark + 一食 round seal */}
      <div className="relative mt-3 flex items-center gap-2">
        <div className="relative size-20 shrink-0">
          <Image
            src="/mascot-giraffe-face.png"
            alt="랜덤한끼 마스코트"
            fill
            sizes="80px"
            priority
            className="object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* `random · hankki` is JetBrains Mono with letter-spacing; that
              spacing also adds a half-space at the very start, so the text
              sits ~2px left of the Mincho h1 below. Pad to align. */}
          <p className="eyebrow mb-1 pl-[2px] text-sumi-fade">random · hankki</p>
          {/* h1 sits 7px above its baseline so the wordmark hugs the eyebrow
              instead of drifting toward the mascot's chin. */}
          <h1 className="-translate-y-[7px] font-mincho text-[2.4rem] font-semibold leading-none tracking-tight text-sumi-ink">
            랜덤<span className="text-shu">한</span>끼
          </h1>
        </div>

        <span className="hanko-round shrink-0" aria-hidden>
          <span className="hanko-round-kanji">一食</span>
          <span className="hanko-round-romaji">ICHI·SHOKU</span>
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-sumi-mute break-keep">
        고민은 접어두고, 한 집 뽑아드려요.
      </p>

      <div className="hairline mt-4" />
    </header>
  );
}
