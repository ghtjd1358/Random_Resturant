"use client";

import type {
  Category,
  NearbyResponse,
  PlaceLite,
  PriceBucket,
  Subcategory,
} from "@/lib/places/types";
import { bucketToLevel } from "@/lib/places/types";
import {
  annotateAndRank,
  isCandidateQualityOk,
  weightedPick,
  type PickMode,
} from "./score";
import type { Preferences } from "@/lib/db/profile";

export interface RollRequest {
  lat: number;
  lng: number;
  radius: number;
  category: Category;
  skippedIds: Set<string>;
  recentIds: Set<string>;
  preferences?: Preferences;
  openNowOnly?: boolean;
  mode?: PickMode;
  priceLevels?: PriceBucket[];
}

export interface RollResult {
  pick: PlaceLite | null;
  candidates: PlaceLite[];
  reason?:
    | "ok"
    | "no_candidates"
    | "only_recent_left"
    | "only_skipped_left";
}

export async function fetchNearby(params: {
  lat: number;
  lng: number;
  radius: number;
  category: Category;
  subcategory?: Subcategory;
  regionCode?: string;
  signal?: AbortSignal;
}): Promise<PlaceLite[]> {
  const { signal, ...body } = params;
  const res = await fetch("/api/places/nearby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new PickError(err.error ?? "network_error", res.status, err.retryAfterMs);
  }
  const data = (await res.json()) as NearbyResponse;
  return data.places;
}

export function rollFromCandidates(
  raw: PlaceLite[],
  req: RollRequest,
): RollResult {
  const mode: PickMode = req.mode ?? "popular";

  // Build allowed price level set from user's bucket selection
  const allowedLevels = req.priceLevels && req.priceLevels.length > 0
    ? new Set(req.priceLevels.map(bucketToLevel))
    : null;

  const annotated = annotateAndRank(raw, {
    center: { lat: req.lat, lng: req.lng },
    radius: req.radius,
    preferences: req.preferences,
    openNowOnly: req.openNowOnly,
    mode,
  })
    .filter((p) => {
      // Price filter: include unknown prices when user has an active filter
      // (Google often omits priceLevel). Better to include than to hide.
      if (!allowedLevels) return true;
      if (!p.priceLevel || p.priceLevel === "PRICE_LEVEL_UNSPECIFIED") return true;
      return allowedLevels.has(p.priceLevel);
    })
    .filter((p) => isCandidateQualityOk(p, mode));

  const notSkipped = annotated.filter((p) => !req.skippedIds.has(p.id));
  if (notSkipped.length === 0) {
    return {
      pick: null,
      candidates: annotated,
      reason: annotated.length > 0 ? "only_skipped_left" : "no_candidates",
    };
  }

  // Discovery mode widens the shortlist
  const topN = mode === "discovery" ? 15 : 8;

  const pick =
    weightedPick(notSkipped, { topN, avoidIds: req.recentIds }) ??
    weightedPick(notSkipped, { topN });

  return {
    pick,
    candidates: notSkipped,
    reason: pick ? "ok" : "only_recent_left",
  };
}

export class PickError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.name = "PickError";
  }
}
