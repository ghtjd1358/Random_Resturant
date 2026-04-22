"use client";

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

  if (coords) {
    return (
      <ActiveBanner
        coords={coords}
        preset={preset}
        onRefresh={handleRefresh}
        onBackToGps={handleBackToGps}
      />
    );
  }
  if (permission === "denied" || error) {
    return <DeniedBanner message={error} onRetry={request} />;
  }
  return <PendingBanner />;
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
    <div
      className={cn(
        "relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-3 py-2 text-xs transition-colors",
        preset
          ? "border-torii/25 bg-torii/6 text-sumi"
          : stale
            ? "border-torii/15 bg-torii/5 text-muted-foreground"
            : "border-matcha/15 bg-matcha/8 text-matcha-deep",
      )}
    >
      {/* Pulse dot */}
      <span
        aria-hidden
        className="relative flex size-2 shrink-0 items-center justify-center"
      >
        {!stale && !preset && (
          <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-matcha/40" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            preset ? "bg-torii" : stale ? "bg-torii/70" : "bg-matcha",
          )}
        />
      </span>

      {preset ? (
        <Landmark className="size-3.5 text-torii" />
      ) : (
        <MapPin className={cn("size-3.5", stale && "opacity-60")} />
      )}
      <span className="font-heading text-[13px] font-bold tracking-tight">{label}</span>

      {preset ? (
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground/80">
          · {preset.city}
        </span>
      ) : (
        <span
          className={cn(
            "text-[10px] font-medium tracking-wide",
            stale ? "text-torii" : "text-muted-foreground/80",
          )}
        >
          · {formatAge(age)}
          {stale && " · 갱신 필요"}
        </span>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        <PresetSheet>
          <button
            type="button"
            aria-label="지역 변경"
            className="no-select flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            지역
            <ChevronDown className="size-3" />
          </button>
        </PresetSheet>
        {preset ? (
          <button
            type="button"
            onClick={onBackToGps}
            aria-label="현위치로 돌아가기"
            className="no-select rounded-md p-1 text-torii transition-colors hover:bg-torii/15"
          >
            <Navigation className="size-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRefresh}
            aria-label="위치 새로고침"
            className={cn(
              "no-select rounded-md p-1 transition-colors",
              stale
                ? "text-torii hover:bg-torii/15"
                : "text-matcha-deep hover:bg-matcha/15",
            )}
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
    <div className="flex items-start gap-2 rounded-lg border border-torii/25 bg-torii/6 px-3 py-2.5 text-xs">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-torii" />
      <div className="flex-1">
        <p className="font-heading text-[13px] font-bold text-sumi">
          위치 권한이 필요해요
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground break-keep">
          {message ?? "브라우저 설정에서 위치 권한을 허용해 주세요."}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs">
            다시 요청
          </Button>
          <PresetSheet>
            <button
              type="button"
              className="no-select h-7 rounded-md border border-border/60 bg-card px-2 text-[11px] font-medium hover:bg-muted/50"
            >
              지역 직접 선택
            </button>
          </PresetSheet>
        </div>
      </div>
    </div>
  );
}

function PendingBanner() {
  // Two-row layout: status on top, always-visible "skip the wait" CTA on
  // the bottom. The uncertainty of "how long until GPS returns" is the whole
  // user complaint — giving an immediate escape hatch solves it without
  // needing a timer.
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30 text-xs">
      <div className="flex items-center gap-2.5 px-3 py-2 text-muted-foreground">
        <span
          aria-hidden
          className="relative inline-flex size-2 items-center justify-center"
        >
          <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-muted-foreground/30" />
          <span className="relative inline-flex size-2 rounded-full bg-muted-foreground/60" />
        </span>
        <MapPin className="size-3.5" />
        <span className="font-medium">현재 위치 확인 중…</span>
      </div>
      <PresetSheet>
        <button
          type="button"
          className="no-select flex w-full items-center justify-center gap-1.5 border-t border-border/50 bg-torii/5 px-3 py-1.5 text-[11px] font-medium text-torii transition-colors hover:bg-torii/10"
        >
          기다리기 싫다면
          <span className="underline underline-offset-2">지역 직접 고르기</span>
          <ChevronRight className="size-3" />
        </button>
      </PresetSheet>
    </div>
  );
}
