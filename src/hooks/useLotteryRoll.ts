"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useLocationStore, isStale } from "@/stores/useLocationStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { fetchNearby, PickError } from "@/lib/places/pick";
import {
  annotateAndRank,
  isCandidateQualityOk,
  weightedPickN,
} from "@/lib/places/score";
import { bucketToLevel } from "@/lib/places/types";
import { getSkippedIdSet } from "@/lib/db/repo";
import { getProfile, profileToPreferences } from "@/lib/db/profile";
import { guessCountryCode } from "@/lib/geo/region";
import { getFreshPosition } from "@/hooks/useGeolocation";
import type { PlaceLite } from "@/lib/places/types";

// Same TTL as useRoll — back-to-back lottery draws (e.g. user shakes
// then redraws) reuse the pool. weightedPickN with uniform exponent
// guarantees variety from the same pool, so cache hits don't reduce
// perceived randomness.
const CANDIDATE_TTL_MS = 10 * 60 * 1000;

/**
 * Lottery (야바위) roll: same fetch + scoring pipeline as useRoll, but
 * returns N distinct candidates instead of 1. The YabawiModal stages
 * the picks as 3 shell-game bowls; one bowl hides the winner mark.
 */
export function useLotteryRoll() {
  const abortRef = useRef<AbortController | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  const lastFetchedAt = useRef<number>(0);
  const lastCandidates = useRef<Awaited<ReturnType<typeof fetchNearby>>>([]);

  const drawN = useCallback(async (count: number): Promise<PlaceLite[]> => {
    const f = useFiltersStore.getState();
    const s = useSessionStore.getState();
    let l = useLocationStore.getState();

    const needsRefresh = !l.coords || isStale(l.coords.updatedAt);
    if (needsRefresh) {
      const fresh = await getFreshPosition();
      if (!fresh) {
        toast.error("현재 위치가 필요해요.", {
          description: "위치 권한을 허용해 주세요.",
        });
        return [];
      }
      l = useLocationStore.getState();
      lastFetchKey.current = null;
      lastCandidates.current = [];
      lastFetchedAt.current = 0;
    }
    if (!l.coords) {
      toast.error("현재 위치가 필요해요.");
      return [];
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

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
      const cacheStale = Date.now() - lastFetchedAt.current > CANDIDATE_TTL_MS;
      if (
        key !== lastFetchKey.current ||
        candidates.length === 0 ||
        cacheStale
      ) {
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
        lastFetchedAt.current = Date.now();
      }

      const [skippedIds, profile] = await Promise.all([
        getSkippedIdSet().catch(() => new Set<string>()),
        getProfile().catch(() => null),
      ]);
      const preferences = profile ? profileToPreferences(profile) : undefined;

      const allowedLevels =
        f.priceLevels && f.priceLevels.length > 0
          ? new Set(f.priceLevels.map(bucketToLevel))
          : null;

      const ranked = annotateAndRank(candidates, {
        center: { lat: l.coords.lat, lng: l.coords.lng },
        radius: f.radius,
        preferences,
        openNowOnly: f.openNowOnly,
        mode: f.mode,
      })
        .filter((p) => {
          if (!allowedLevels) return true;
          if (!p.priceLevel || p.priceLevel === "PRICE_LEVEL_UNSPECIFIED") return true;
          return allowedLevels.has(p.priceLevel);
        })
        .filter((p) => isCandidateQualityOk(p, f.mode))
        .filter((p) => !skippedIds.has(p.id));

      // top pool size scales with stick count so 5 sticks still feels
      // varied: at minimum 2× the requested count, capped at 15 (same as
      // discovery mode's shortlist).
      const topN = Math.min(15, Math.max(count * 2, 8));
      const picks = weightedPickN(ranked, count, { topN });

      if (picks.length === 0) {
        toast.info("이 반경에 적합한 후보가 없어요.", {
          description: "반경을 넓혀보거나 다른 카테고리로 시도해 보세요.",
        });
      }
      // Push picked IDs into the recent buffer so back-to-back lottery
      // draws don't reuse the same set.
      picks.forEach((p) => s.pushPickedId(p.id));
      return picks;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return [];
      if (err instanceof PickError && err.status === 429) {
        toast.error("잠시 후 다시 시도해 주세요.", {
          description: "요청이 너무 많아요. 약 1분 뒤에 다시 시도해 보세요.",
        });
      } else {
        toast.error("후보를 가져오지 못했어요.", {
          description: err instanceof Error ? err.message : "알 수 없는 오류",
        });
      }
      return [];
    }
  }, []);

  return { drawN };
}
