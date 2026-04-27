"use client";

import { getDB } from "./client";
import type {
  Feedback,
  SkippedRecord,
  VisitedRecord,
} from "./schema";
import type { Category, PlaceLite } from "@/lib/places/types";
import { updateProfileFromFeedback } from "./profile";

/* -------------------------------------------------------------------------- */
/*  Read helpers                                                               */
/* -------------------------------------------------------------------------- */

export async function listVisited(filter?: {
  feedback?: Feedback;
  category?: Category;
}): Promise<VisitedRecord[]> {
  const db = await getDB();
  const tx = db.transaction("visited", "readonly");
  const idx = tx.store.index("byVisitedAt");
  const out: VisitedRecord[] = [];
  // Reverse cursor → most recent first
  for await (const cur of idx.iterate(null, "prev")) {
    const v = cur.value;
    if (filter?.feedback && v.feedback !== filter.feedback) continue;
    if (filter?.category && v.category !== filter.category) continue;
    out.push(v);
  }
  return out;
}

export async function listSkipped(): Promise<SkippedRecord[]> {
  const db = await getDB();
  const idx = db
    .transaction("skipped", "readonly")
    .store.index("bySkippedAt");
  const out: SkippedRecord[] = [];
  for await (const cur of idx.iterate(null, "prev")) {
    out.push(cur.value);
  }
  return out;
}

export async function getSkippedIdSet(): Promise<Set<string>> {
  const db = await getDB();
  const keys = await db.getAllKeys("skipped");
  return new Set(keys.map(String));
}

export async function getVisitedIdSet(
  feedback?: Feedback,
): Promise<Set<string>> {
  const db = await getDB();
  if (!feedback) {
    const keys = await db.getAllKeys("visited");
    return new Set(keys.map(String));
  }
  const idx = db.transaction("visited", "readonly").store.index("byFeedback");
  const keys = await idx.getAllKeys(feedback);
  return new Set(keys.map(String));
}

/* -------------------------------------------------------------------------- */
/*  Write operations                                                           */
/* -------------------------------------------------------------------------- */

export async function markVisited(
  place: PlaceLite,
  feedback: Feedback,
  category: Category,
): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  // 👎 must write to both stores atomically so the place can never reappear
  // between the two writes.
  const stores = feedback === "bad" ? ["visited", "skipped"] : ["visited"];
  const tx = db.transaction(stores as ("visited" | "skipped")[], "readwrite");

  const visitedRec: VisitedRecord = {
    placeId: place.id,
    name: place.name,
    category,
    feedback,
    visitedAt: now,
    lat: place.location.lat,
    lng: place.location.lng,
    primaryType: place.primaryType,
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
  };
  await tx.objectStore("visited").put(visitedRec);

  if (feedback === "bad") {
    const skippedRec: SkippedRecord = {
      placeId: place.id,
      name: place.name,
      category,
      reason: "bad_feedback",
      skippedAt: now,
      lat: place.location.lat,
      lng: place.location.lng,
      googleMapsUri: place.googleMapsUri,
    };
    await tx.objectStore("skipped").put(skippedRec);
  }

  await tx.done;

  // Update taste profile asynchronously — don't block the UI on it.
  updateProfileFromFeedback(place, feedback).catch(() => {
    /* personalization is best-effort */
  });
}

export async function skipPlace(
  place: PlaceLite,
  category: Category,
): Promise<void> {
  const db = await getDB();
  const rec: SkippedRecord = {
    placeId: place.id,
    name: place.name,
    category,
    reason: "manual",
    skippedAt: Date.now(),
    lat: place.location.lat,
    lng: place.location.lng,
    googleMapsUri: place.googleMapsUri,
  };
  await db.put("skipped", rec);
}

export async function unskipPlace(placeId: string): Promise<void> {
  const db = await getDB();
  await db.delete("skipped", placeId);
}

export async function deleteVisited(placeId: string): Promise<void> {
  const db = await getDB();
  await db.delete("visited", placeId);
}

/**
 * Bulk delete a set of visited records. Mirrors the single-row `remove` flow
 * in useVisitedRecords: bad-feedback rows must also drop their `skipped`
 * twin (only when the skip was reason="bad_feedback") so the place returns
 * to the lottery pool.
 */
export async function deleteVisitedMany(placeIds: string[]): Promise<void> {
  if (placeIds.length === 0) return;
  const db = await getDB();
  const tx = db.transaction(["visited", "skipped"], "readwrite");
  const visited = tx.objectStore("visited");
  const skipped = tx.objectStore("skipped");

  for (const id of placeIds) {
    const v = await visited.get(id);
    if (v?.feedback === "bad") {
      const s = await skipped.get(id);
      if (s && s.reason === "bad_feedback") await skipped.delete(id);
    }
    await visited.delete(id);
  }
  await tx.done;
}

/**
 * Wipe every visited record. Bad-feedback skips that exist solely because
 * of a visit are also dropped — same rationale as deleteVisitedMany.
 */
export async function clearAllVisited(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["visited", "skipped"], "readwrite");
  const visited = tx.objectStore("visited");
  const skipped = tx.objectStore("skipped");

  for await (const cur of visited.iterate()) {
    if (cur.value.feedback === "bad") {
      const s = await skipped.get(cur.value.placeId);
      if (s && s.reason === "bad_feedback") await skipped.delete(cur.value.placeId);
    }
  }
  await visited.clear();
  await tx.done;
}

/**
 * Flip the feedback on an existing visited record. Also syncs the skipped
 * store so 👍→👎 auto-skips and 👎→👍 un-skips (when the skip was caused
 * by bad feedback).
 */
export async function updateVisitedFeedback(
  placeId: string,
  newFeedback: Feedback,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["visited", "skipped"], "readwrite");

  const existing = await tx.objectStore("visited").get(placeId);
  if (!existing) {
    await tx.done;
    return;
  }

  if (existing.feedback === newFeedback) {
    await tx.done;
    return; // no-op
  }

  const updated: VisitedRecord = {
    ...existing,
    feedback: newFeedback,
    visitedAt: Date.now(), // bump to surface the change
  };
  await tx.objectStore("visited").put(updated);

  if (newFeedback === "bad") {
    const skippedRec: SkippedRecord = {
      placeId: existing.placeId,
      name: existing.name,
      category: existing.category,
      reason: "bad_feedback",
      skippedAt: Date.now(),
      lat: existing.lat,
      lng: existing.lng,
      googleMapsUri: existing.googleMapsUri,
    };
    await tx.objectStore("skipped").put(skippedRec);
  } else {
    // Changed to good → remove from skipped only if that skip came from bad feedback
    const currentSkip = await tx.objectStore("skipped").get(placeId);
    if (currentSkip && currentSkip.reason === "bad_feedback") {
      await tx.objectStore("skipped").delete(placeId);
    }
  }

  await tx.done;
}

export async function resetSkipped(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction("skipped", "readwrite");
  const count = await tx.store.count();
  await tx.store.clear();
  await tx.done;
  return count;
}
