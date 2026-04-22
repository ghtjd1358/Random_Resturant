import type { Category } from "@/lib/places/types";

export const DB_NAME = "randomRestuarant";
export const DB_VERSION = 2;

export type Feedback = "good" | "bad";
export type SkipReason = "manual" | "bad_feedback";

export interface VisitedRecord {
  placeId: string;
  name: string;
  category: Category;
  feedback: Feedback;
  visitedAt: number;
  lat: number;
  lng: number;
  notes?: string;
  primaryType?: string;
  rating?: number;
  /** Google Maps deep link — preferred for re-opening the place. */
  googleMapsUri?: string;
}

export interface SkippedRecord {
  placeId: string;
  name: string;
  category: Category;
  reason: SkipReason;
  skippedAt: number;
  lat: number;
  lng: number;
  googleMapsUri?: string;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt?: number;
  center: { lat: number; lng: number };
  radius: number;
  category: Category;
  pickedIds: string[];
}

/** Learned taste profile — one row per user (stable key "me"). */
export interface ProfileRecord {
  id: "me";
  /** Additive bias per Google Places primaryType (e.g. "ramen_restaurant"). */
  typeBias: Record<string, number>;
  /** Additive bias per PRICE_LEVEL_* bucket. */
  priceBias: Record<string, number>;
  totalGood: number;
  totalBad: number;
  updatedAt: number;
}

export interface RRSchema {
  visited: {
    key: string;
    value: VisitedRecord;
    indexes: {
      byVisitedAt: number;
      byCategory: Category;
      byFeedback: Feedback;
    };
  };
  skipped: {
    key: string;
    value: SkippedRecord;
    indexes: {
      bySkippedAt: number;
      byCategory: Category;
    };
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { byStartedAt: number };
  };
  profile: {
    key: string;
    value: ProfileRecord;
  };
}
