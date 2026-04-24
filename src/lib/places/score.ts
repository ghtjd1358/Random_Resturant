import type { PlaceLite } from "./types";
import { haversine } from "@/lib/geo/haversine";
import type { Preferences } from "@/lib/db/profile";

export type PickMode = "popular" | "discovery";

export interface ScoreContext {
  center: { lat: number; lng: number };
  radius: number;
  preferences?: Preferences;
  openNowOnly?: boolean;
  mode?: PickMode;
}

const DEFAULT_RATING = 3.5;
const DEFAULT_COUNT = 0;

/**
 * Mode-aware scoring.
 *
 * - popular: Bayesian weighted rating — surfaces mainstream favorites.
 * - discovery: inverse-popularity lens — rewards the sweet spot of 20~80
 *   reviews, gently penalizes mainstream heavyweights, relaxes the rating
 *   floor so under-reviewed spots get a fair shot.
 */
export function scorePlace(p: PlaceLite, ctx: ScoreContext): number {
  if (ctx.openNowOnly && p.openNow === false) return -Infinity;

  const rating = p.rating ?? DEFAULT_RATING;
  const count = p.userRatingCount ?? DEFAULT_COUNT;
  const distance = p.distanceMeters ?? haversine(ctx.center, p.location);
  const distBonus = Math.max(0, (ctx.radius - distance) / ctx.radius);

  let base: number;
  if (ctx.mode === "discovery") {
    // Sweet-spot bonus: ~20~80 reviews = has signal, still under-the-radar.
    let sweetBonus = 0;
    if (count >= 20 && count <= 80) sweetBonus = 2.2;
    else if (count > 80 && count <= 200) sweetBonus = 1.0;
    else if (count >= 3 && count < 20) sweetBonus = 1.5; // "barely discovered"
    else if (count === 0) sweetBonus = 0.8; // pure adventure

    // Penalize mainstream heavyweights
    const mainstreamPenalty =
      count > 200 ? Math.log10(count / 200) * 1.8 : 0;

    // Ratings matter less — we trust the sample less too
    const ratingFactor =
      rating > 0 ? rating * 0.5 : 1.2; // unrated places get a modest base

    // Distance weighted higher in discovery — "right around me" matters more
    base = ratingFactor + sweetBonus - mainstreamPenalty + distBonus * 2.0;
  } else {
    // popular (default)
    const popularBase = rating * Math.log10(count + 1);
    const fewPenalty = count < 20 ? 1.0 : 0;
    base = popularBase + distBonus * 1.5 - fewPenalty;
  }

  // Personalization bias applies to both modes.
  let personal = 0;
  if (ctx.preferences) {
    const { typeBias, priceBias, confidence } = ctx.preferences;
    if (p.primaryType && typeBias[p.primaryType]) {
      personal += typeBias[p.primaryType];
    }
    if (p.priceLevel && priceBias[p.priceLevel]) {
      personal += priceBias[p.priceLevel];
    }
    personal *= confidence;
  }

  return base + personal;
}

export function annotateAndRank(
  places: PlaceLite[],
  ctx: ScoreContext,
): PlaceLite[] {
  return places
    .map((p) => {
      const distance = haversine(ctx.center, p.location);
      const withDist = { ...p, distanceMeters: distance };
      return { ...withDist, score: scorePlace(withDist, ctx) };
    })
    .filter((p) => Number.isFinite(p.score ?? 0))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function weightedPick<T extends { id: string; score?: number }>(
  candidates: T[],
  opts: { topN?: number; avoidIds?: Set<string>; exponent?: number } = {},
): T | null {
  const { topN = 8, avoidIds, exponent = 2 } = opts;

  const pool = avoidIds
    ? candidates.filter((c) => !avoidIds.has(c.id))
    : candidates;

  const top = pool.slice(0, topN);
  if (top.length === 0) return null;
  if (top.length === 1) return top[0];

  const weights = top.map((c) => Math.max(0.01, (c.score ?? 0) ** exponent));
  const sum = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * sum;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i];
  }
  return top[top.length - 1];
}

/**
 * Pick `count` distinct candidates with score-proportional weights — the
 * 제비뽑기 (kuji) variant of weightedPick. Each round zeroes out the
 * winner's weight so the next round can't pick it again.
 *
 * Result order is the order they were drawn (first draw = first stick), so
 * the caller can render them as sticks loaded into a cylinder in sequence.
 */
export function weightedPickN<T extends { id: string; score?: number }>(
  candidates: T[],
  count: number,
  opts: { topN?: number; avoidIds?: Set<string>; exponent?: number } = {},
): T[] {
  const { topN = 15, avoidIds, exponent = 2 } = opts;

  const pool = avoidIds
    ? candidates.filter((c) => !avoidIds.has(c.id))
    : candidates;

  const top = pool.slice(0, topN);
  if (top.length === 0) return [];

  const want = Math.min(count, top.length);
  const remaining = [...top];
  const weights = top.map((c) => Math.max(0.01, (c.score ?? 0) ** exponent));
  const picks: T[] = [];

  for (let drawn = 0; drawn < want; drawn++) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) break;

    let r = Math.random() * sum;
    let chosen = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    picks.push(remaining[chosen]);
    weights[chosen] = 0; // zero out so next round can't pick this one
  }

  return picks;
}

/** Mode-aware quality gate. Discovery mode relaxes almost everything. */
export function isCandidateQualityOk(p: PlaceLite, mode: PickMode = "popular"): boolean {
  const count = p.userRatingCount ?? 0;
  const rating = p.rating ?? 0;

  if (mode === "discovery") {
    // Allow very sparse spots, but still filter out obvious duds (1-2 reviews
    // averaging below 3.0 are statistically likely to be bad).
    if (count === 0) return true; // pure adventure — always allow
    if (count < 3 && rating < 3.0) return false;
    return rating >= 3.3;
  }

  return count >= 5 && rating >= 3.5;
}
