"use client";

import { getDB } from "./client";
import type { ProfileRecord } from "./schema";
import type { Feedback } from "./schema";
import type { PlaceLite } from "@/lib/places/types";

/**
 * Lightweight on-device taste learning. Each 👍 nudges the bias for that
 * place's primaryType / priceLevel up, each 👎 nudges it down. Bias values are
 * EMA-style (bounded, decaying) so a single 👎 can't permanently blacklist
 * an entire category.
 */

const EMPTY: ProfileRecord = {
  id: "me",
  typeBias: {},
  priceBias: {},
  totalGood: 0,
  totalBad: 0,
  updatedAt: 0,
};

const LEARN_RATE = 0.35;
const BIAS_MIN = -2.5;
const BIAS_MAX = 2.5;

export async function getProfile(): Promise<ProfileRecord> {
  try {
    const db = await getDB();
    const row = await db.get("profile", "me");
    return row ?? { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export async function updateProfileFromFeedback(
  place: PlaceLite,
  feedback: Feedback,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("profile", "readwrite");
  const current = (await tx.store.get("me")) ?? { ...EMPTY };

  const delta = feedback === "good" ? +1 : -1;
  const primaryType = place.primaryType;
  const priceLevel = place.priceLevel;

  const next: ProfileRecord = {
    ...current,
    typeBias: { ...current.typeBias },
    priceBias: { ...current.priceBias },
    totalGood: current.totalGood + (feedback === "good" ? 1 : 0),
    totalBad: current.totalBad + (feedback === "bad" ? 1 : 0),
    updatedAt: Date.now(),
  };

  if (primaryType) {
    next.typeBias[primaryType] = clamp(
      (next.typeBias[primaryType] ?? 0) + delta * LEARN_RATE,
    );
  }
  if (priceLevel) {
    next.priceBias[priceLevel] = clamp(
      (next.priceBias[priceLevel] ?? 0) + delta * LEARN_RATE * 0.6,
    );
  }

  await tx.store.put(next);
  await tx.done;
}

function clamp(n: number): number {
  return Math.max(BIAS_MIN, Math.min(BIAS_MAX, n));
}

export interface Preferences {
  typeBias: Record<string, number>;
  priceBias: Record<string, number>;
  /** 0..1 — how confident the model is. Grows with more feedback. */
  confidence: number;
}

export function profileToPreferences(p: ProfileRecord): Preferences {
  const total = p.totalGood + p.totalBad;
  // 20 samples → ~0.9 confidence. Tuned so new users aren't locked in fast.
  const confidence = total === 0 ? 0 : Math.min(1, Math.log10(total + 1) / Math.log10(21));
  return {
    typeBias: p.typeBias,
    priceBias: p.priceBias,
    confidence,
  };
}
