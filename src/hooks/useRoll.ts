"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/useSessionStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useLocationStore } from "@/stores/useLocationStore";
import { fetchNearby, rollFromCandidates, PickError } from "@/lib/places/pick";
import { getSkippedIdSet } from "@/lib/db/repo";
import { getProfile, profileToPreferences } from "@/lib/db/profile";
import { guessCountryCode } from "@/lib/geo/region";
import { isStale } from "@/stores/useLocationStore";
import { getFreshPosition } from "@/hooks/useGeolocation";
import type { PlaceLite } from "@/lib/places/types";

/**
 * Runs one recommendation cycle: GPS refresh → Places API → filter+score → pick.
 *
 * Returns the selected place WITHOUT committing it to currentPick. Callers
 * (DiceButton, ActionBar) decide when to reveal it — e.g. DiceButton waits
 * for the spin animation to finish so the card doesn't appear mid-spin.
 */
export function useRoll() {
  const abortRef = useRef<AbortController | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  const lastCandidates = useRef<Awaited<ReturnType<typeof fetchNearby>>>([]);

  const roll = useCallback(async (): Promise<PlaceLite | null> => {
    const s = useSessionStore.getState();
    const f = useFiltersStore.getState();
    let l = useLocationStore.getState();

    const needsRefresh = !l.coords || isStale(l.coords.updatedAt);
    if (needsRefresh) {
      s.setStatus("rolling");
      const fresh = await getFreshPosition();
      if (!fresh) {
        toast.error("현재 위치가 필요해요.", {
          description: "위치 권한을 허용해 주세요.",
        });
        s.setError("위치 권한이 필요합니다.");
        return null;
      }
      l = useLocationStore.getState();
      lastFetchKey.current = null;
      lastCandidates.current = [];
    }

    if (!l.coords) {
      toast.error("현재 위치가 필요해요.");
      s.setError("위치 권한이 필요합니다.");
      return null;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    s.setStatus("rolling");

    try {
      const regionCode = guessCountryCode(l.coords.lat, l.coords.lng) ?? undefined;
      const key = [
        f.category,
        f.subcategory ?? "all",
        f.radius,
        f.openNowOnly ? "open" : "any",
        regionCode ?? "auto",
        l.coords.lat.toFixed(3),
        l.coords.lng.toFixed(3),
      ].join(":");

      let candidates = lastCandidates.current;
      if (key !== lastFetchKey.current || candidates.length === 0) {
        candidates = await fetchNearby({
          lat: l.coords.lat,
          lng: l.coords.lng,
          radius: f.radius,
          category: f.category,
          subcategory: f.subcategory,
          regionCode,
          signal: ctrl.signal,
        });
        lastFetchKey.current = key;
        lastCandidates.current = candidates;
      }

      const [skippedIds, profile] = await Promise.all([
        getSkippedIdSet().catch(() => new Set<string>()),
        getProfile().catch(() => null),
      ]);
      const preferences = profile ? profileToPreferences(profile) : undefined;
      const recentIds = new Set(s.lastPickedIds);

      const result = rollFromCandidates(candidates, {
        lat: l.coords.lat,
        lng: l.coords.lng,
        radius: f.radius,
        category: f.category,
        skippedIds,
        recentIds,
        preferences,
        openNowOnly: f.openNowOnly,
        mode: f.mode,
        priceLevels: f.priceLevels,
      });

      if (!result.pick) {
        if (result.reason === "no_candidates") {
          toast.info("이 반경에 적합한 후보가 없어요.", {
            description: f.openNowOnly
              ? "영업 중 필터를 끄거나 반경을 넓혀보세요."
              : "반경을 넓혀보거나 다른 카테고리로 시도해 보세요.",
          });
        } else if (result.reason === "only_skipped_left") {
          toast.info("남은 후보가 전부 스킵된 곳이에요.", {
            description: "설정 → 다시는 안 볼 곳에서 일부를 복구해 보세요.",
          });
        }
        s.setCandidates(result.candidates);
        s.setStatus("idle");
        return null;
      }

      s.setCandidates(result.candidates);
      // NOTE: intentionally NOT calling setCurrentPick here — caller reveals
      // the pick at the right time (after spin animation, etc).
      return result.pick;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;

      if (err instanceof PickError && err.status === 429) {
        toast.error("잠시 후 다시 시도해 주세요.", {
          description: "요청이 너무 많아요. 약 1분 뒤에 다시 시도해 보세요.",
        });
      } else {
        toast.error("추천을 가져오지 못했어요.", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
      s.setError(err instanceof Error ? err.message : "알 수 없는 오류");
      return null;
    }
  }, []);

  /** Commit a pick to session state (shows the card). */
  const reveal = useCallback((pick: PlaceLite | null) => {
    if (!pick) return;
    const s = useSessionStore.getState();
    s.setCurrentPick(pick);
    s.pushPickedId(pick.id);
    s.setStatus("ready");
  }, []);

  /** Convenience: roll and immediately reveal (for UI without animation). */
  const rollAndReveal = useCallback(async () => {
    const pick = await roll();
    reveal(pick);
    return pick;
  }, [roll, reveal]);

  return { roll, reveal, rollAndReveal };
}
