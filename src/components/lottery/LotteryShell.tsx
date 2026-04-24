"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";
import { LocationBanner } from "@/components/home/LocationBanner";
import { CategoryToggle } from "@/components/home/CategoryToggle";
import { SubcategoryChips } from "@/components/home/SubcategoryChips";
import { ModeToggle } from "@/components/home/ModeToggle";
import { PriceFilter } from "@/components/home/PriceFilter";
import { RadiusSlider } from "@/components/home/RadiusSlider";
import { OpenNowToggle } from "@/components/home/OpenNowToggle";
import { isFiltersDefault, useFiltersStore } from "@/stores/useFiltersStore";
import { useLocationStore } from "@/stores/useLocationStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLotteryRoll } from "@/hooks/useLotteryRoll";
import { useLotteryStore, type StickCount } from "@/stores/useLotteryStore";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { YabawiModal } from "./YabawiModal";
import type { PlaceLite } from "@/lib/places/types";

const STICK_OPTIONS: { value: StickCount; label: string }[] = [
  { value: 3, label: "3本" },
  { value: 5, label: "5本" },
];

export function LotteryShell() {
  useGeolocation();

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
  const resetFilters = useFiltersStore((s) => s.resetFilters);
  const isDefault = useFiltersStore(isFiltersDefault);
  const stickCount = useLotteryStore((s) => s.stickCount);
  const setStickCount = useLotteryStore((s) => s.setStickCount);
  const hasLocation = useLocationStore((s) => s.coords !== null);

  const { drawN } = useLotteryRoll();
  const [picks, setPicks] = useState<PlaceLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleResetFilters = () => {
    haptic.tap();
    resetFilters();
  };

  // Apply category shortcut from PWA manifest (?c=food|cafe), same as Home.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("c");
    if (p === "food" || p === "cafe") setCategory(p);
  }, [setCategory]);

  const handleDraw = async () => {
    if (loading || !hasLocation) return;
    haptic.tap();
    setLoading(true);
    const result = await drawN(stickCount);
    setLoading(false);
    if (result.length > 0) setPicks(result);
  };

  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="籤" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="籤"
          jpLabel={
            <>
              제비뽑기
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">KUJI</span>
            </>
          }
          title="제비뽑기"
          sealKanji="抽選"
          sealRomaji="CHUUSEN"
          subtitle="후보를 막대기에 담아 한 집을 뽑습니다."
        />

        <div className="mt-4">
          <LocationBanner />
        </div>

        <div className="mt-4">
          <CategoryToggle value={category} onChange={setCategory} />
        </div>
        <div className="mt-3">
          <SubcategoryChips
            category={category}
            value={subcategory}
            onChange={setSubcategory}
          />
        </div>

        {/* Stick count toggle */}
        <div className="mt-5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mincho text-[14px] font-medium text-sumi-ink">
              本
            </span>
            <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
              막대기 개수
            </span>
            <span className="eyebrow text-[9px]">/ STICKS</span>
          </div>
          <div role="radiogroup" aria-label="막대기 개수" className="flex gap-1.5">
            {STICK_OPTIONS.map(({ value, label }) => {
              const active = stickCount === value;
              return (
                <button
                  key={value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    if (stickCount !== value) {
                      haptic.select();
                      setStickCount(value);
                    }
                  }}
                  className={cn(
                    "no-select font-mincho border px-3 py-1 text-[12px] tracking-tight transition-colors",
                    active
                      ? "border-sumi-ink bg-sumi-ink text-paper"
                      : "border-hairline text-sumi-ink hover:border-sumi-ink/40",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail filter toggle — expands to mode/price/radius/open + reset.
            Same controls as Home's "더 자세히" so settings stay consistent
            across pick and lottery (filters store is shared anyway). */}
        <div className="mt-3 flex items-baseline justify-end">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-shu transition-opacity hover:opacity-70"
          >
            {expanded ? "닫기" : "더 자세히"}
            <ChevronDown
              className={cn("size-3 transition-transform", expanded && "rotate-180")}
            />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 flex flex-col gap-3 border-t border-hairline-soft pt-3">
            <ModeToggle value={mode} onChange={setMode} />
            <PriceFilter
              value={priceLevels}
              onToggle={togglePriceLevel}
              onClear={clearPriceLevels}
            />
            <RadiusSlider value={radius} onChange={setRadius} />
            <OpenNowToggle value={openNowOnly} onChange={setOpenNowOnly} />

            <button
              type="button"
              onClick={handleResetFilters}
              disabled={isDefault}
              className={cn(
                "no-select group mt-1 flex items-center justify-center gap-1.5 border py-2.5 text-[12px] font-mincho tracking-tight transition-colors",
                isDefault
                  ? "border-hairline-soft text-sumi-fade cursor-not-allowed"
                  : "border-shu/40 text-shu hover:bg-shu/5",
              )}
            >
              <RotateCcw className="size-3.5" strokeWidth={1.5} />
              {isDefault ? "기본값입니다" : "필터 초기화 · 初期化"}
            </button>
          </div>
        )}

        {/* Big draw button — motion whileTap + idle pulse + glyph animation
            mirrors DiceButton's polish for consistency across pick/lottery. */}
        <section className="mt-10 flex flex-col items-center gap-3">
          <p className="eyebrow">탭해서 제비뽑기</p>
          <motion.button
            type="button"
            onClick={handleDraw}
            disabled={loading || !hasLocation}
            whileTap={{ scale: 0.96 }}
            aria-label="제비뽑기 시작"
            className={cn(
              "no-select relative flex size-36 items-center justify-center rounded-full",
              "bg-sumi-ink text-paper transition-opacity duration-200",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            style={{
              boxShadow: loading
                ? "0 2px 4px rgba(28, 24, 21, 0.1)"
                : "0 2px 3px rgba(28, 24, 21, 0.15), 0 18px 32px -14px rgba(28, 24, 21, 0.4)",
            }}
          >
            <span
              aria-hidden
              className="absolute right-4 top-4 size-1.5 rounded-full bg-shu"
            />
            {/* 籤 wobbles softly while loading — small "shaking the can"
                cue without a heavy spin. */}
            <motion.span
              className="font-mincho text-paper"
              style={{
                fontSize: "3.5rem",
                fontWeight: 500,
                lineHeight: 1,
                display: "inline-block",
              }}
              animate={
                loading
                  ? { rotate: [0, -8, 7, -5, 0] }
                  : { rotate: 0 }
              }
              transition={
                loading
                  ? { duration: 1.0, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 280, damping: 22 }
              }
            >
              籤
            </motion.span>
          </motion.button>

          {/* Helper text crossfades on phase swap so "통에 막대기를 채웁니다"
              → "후보를 모으는 중 …" doesn't hard-jump. */}
          <AnimatePresence mode="wait">
            <motion.p
              key={loading ? "loading" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "font-mincho text-[12px] tracking-tight",
                loading ? "text-sumi-ink" : "text-sumi-mute",
              )}
            >
              {loading ? "후보를 모으는 중 …" : "통에 막대기를 채웁니다"}
            </motion.p>
          </AnimatePresence>
        </section>

        <p className="font-mincho mx-auto mt-8 max-w-[280px] text-center text-[11px] leading-relaxed text-sumi-fade">
          뽑기 탭이 한 집을 바로 골라준다면, 籤은 후보 {stickCount}개를 통에
          담아 흔들어 한 집을 뽑습니다. 카테고리 · 거리 · 가격대 필터는
          뽑기 탭과 공유합니다.
        </p>
      </div>

      {picks && (
        <YabawiModal picks={picks} onClose={() => setPicks(null)} />
      )}
    </div>
  );
}
