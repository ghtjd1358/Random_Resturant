"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ChevronDown, ChevronRight, Landmark, MapPin, Navigation, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresetSheet } from "./PresetSheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTicker } from "@/hooks/useTicker";
import { guessRegion } from "@/lib/geo/region";
import { findPreset, type LocationPreset } from "@/lib/geo/presets";
import { LOCATION_STALE_MS, useLocationStore } from "@/stores/useLocationStore";
import { haptic } from "@/lib/haptic";
import { formatAge } from "@/lib/format/time";
import { cn } from "@/lib/utils";

export function LocationBanner() {
  const { coords, permission, error, request } = useGeolocation();
  const source = useLocationStore((s) => s.source);
  const presetId = useLocationStore((s) => s.presetId);
  const clearPreset = useLocationStore((s) => s.clearPreset);
  useTicker(20_000, coords !== null && source === "gps");

  const preset = source === "preset" && presetId ? findPreset(presetId) ?? null : null;

  const handleRefresh = () => {
    haptic.tap();
    request();
  };

  const handleBackToGps = () => {
    haptic.tap();
    clearPreset();
    request();
  };

  // Phase swap (pending → active / denied) crossfades via AnimatePresence
  // so the banner doesn't hard-snap when GPS resolves. mode="wait" so the
  // outgoing phase finishes before the new one slides in.
  const phaseKey = coords ? "active" : permission === "denied" || error ? "denied" : "pending";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {coords ? (
          <ActiveBanner
            coords={coords}
            preset={preset}
            onRefresh={handleRefresh}
            onBackToGps={handleBackToGps}
          />
        ) : permission === "denied" || error ? (
          <DeniedBanner message={error} onRetry={request} />
        ) : (
          <PendingBanner />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function ActiveBanner({
  coords,
  preset,
  onRefresh,
  onBackToGps,
}: {
  coords: { lat: number; lng: number; updatedAt: number };
  preset: LocationPreset | null;
  onRefresh: () => void;
  onBackToGps: () => void;
}) {
  const region = preset ? preset.city : guessRegion(coords.lat, coords.lng);
  const age = Date.now() - coords.updatedAt;
  // Presets don't go stale — they're static reference points.
  const stale = !preset && age > LOCATION_STALE_MS;

  const label = preset ? preset.label : region ?? "현위치";

  return (
    <div className="flex items-center gap-2.5 border-y border-hairline-soft py-2.5 text-[12px]">
      {/* Pulse dot */}
      <span
        aria-hidden
        className="relative flex size-2 shrink-0 items-center justify-center"
      >
        {!stale && !preset && (
          <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-shu/30" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            preset ? "bg-shu" : stale ? "bg-shu/70" : "bg-sumi-ink",
          )}
        />
      </span>

      {preset ? (
        <Landmark className="size-3.5 text-shu" />
      ) : (
        <MapPin className={cn("size-3.5 text-sumi-mute", stale && "opacity-60")} />
      )}

      <span className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
        {label}
      </span>

      <span
        className={cn(
          "text-[11px] num-tabular",
          stale ? "text-shu" : "text-sumi-fade",
        )}
      >
        · {preset ? preset.city : formatAge(age)}
        {!preset && stale && " · 갱신 필요"}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <PresetSheet>
          <button
            type="button"
            aria-label="지역 변경"
            className="no-select inline-flex items-center gap-0.5 text-[11px] font-medium tracking-wide text-shu transition-opacity hover:opacity-70"
          >
            위치 바꾸기
            <ChevronDown className="size-3" />
          </button>
        </PresetSheet>
        {preset ? (
          <button
            type="button"
            onClick={onBackToGps}
            aria-label="현위치로 돌아가기"
            className="no-select rounded-sm p-1 text-sumi-mute transition-colors hover:text-sumi-ink"
          >
            <Navigation className="size-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="위치 새로고침"
            className="no-select rounded-sm p-1 text-sumi-mute transition-colors hover:text-sumi-ink"
          >
            <RotateCw className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function DeniedBanner({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="border-y border-hairline-soft py-3 text-[12px]">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-shu" />
        <div className="flex-1">
          <p className="font-mincho text-[13px] font-medium text-sumi-ink">
            위치 권한이 필요해요
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-sumi-mute break-keep">
            {message ?? "브라우저 설정에서 위치 권한을 허용해 주세요."}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="h-7 px-0 text-[11px] font-medium text-shu hover:bg-transparent hover:opacity-70"
            >
              다시 요청
            </Button>
            <PresetSheet>
              <button
                type="button"
                className="no-select h-7 text-[11px] font-medium text-sumi-mute transition-opacity hover:opacity-70"
              >
                지역 직접 선택
              </button>
            </PresetSheet>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingBanner() {
  return (
    <div className="border-y border-hairline-soft py-2.5 text-[12px]">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="relative inline-flex size-2 items-center justify-center"
        >
          <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-sumi-fade/30" />
          <span className="relative inline-flex size-2 rounded-full bg-sumi-fade/70" />
        </span>
        <MapPin className="size-3.5 text-sumi-mute" />
        <span className="font-mincho text-[13px] font-medium text-sumi-mute">
          현재 위치 확인 중…
        </span>
        <PresetSheet>
          <button
            type="button"
            className="no-select ml-auto inline-flex items-center gap-0.5 text-[11px] font-medium text-shu transition-opacity hover:opacity-70"
          >
            지역 직접 고르기
            <ChevronRight className="size-3" />
          </button>
        </PresetSheet>
      </div>
    </div>
  );
}
