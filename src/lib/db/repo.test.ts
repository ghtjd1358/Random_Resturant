import { beforeEach, describe, expect, test } from "vitest";
import {
  deleteVisitedMany,
  listSkipped,
  listVisited,
  markVisited,
  skipPlace,
  updateVisitedFeedback,
} from "./repo";
import { getDB } from "./client";
import type { PlaceLite } from "@/lib/places/types";

/**
 * These tests guard the single most fragile invariant in the repo: when a
 * place is marked 👎 (bad feedback), it must appear in BOTH `visited` and
 * `skipped` so the lottery never re-rolls it. Inversely, flipping 👎 → 👍 has
 * to drop the skipped twin. Manual skips (no `bad_feedback` reason) must be
 * preserved across these flows.
 *
 * Setup uses `fake-indexeddb/auto` (wired in vitest.setup.ts) and clears all
 * stores between tests instead of recreating the database — avoids the
 * `dbPromise` singleton inside client.ts becoming stale across resets.
 */

function place(id: string, name = `Place ${id}`): PlaceLite {
  return {
    id,
    name,
    location: { lat: 35.0, lng: 139.7 },
    primaryType: "ramen_restaurant",
  };
}

beforeEach(async () => {
  const db = await getDB();
  const tx = db.transaction(
    ["visited", "skipped", "sessions", "profile"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("visited").clear(),
    tx.objectStore("skipped").clear(),
    tx.objectStore("sessions").clear(),
    tx.objectStore("profile").clear(),
  ]);
  await tx.done;
});

describe("markVisited", () => {
  test("👍 writes only to visited", async () => {
    await markVisited(place("p1"), "good", "food");
    const v = await listVisited();
    const s = await listSkipped();
    expect(v).toHaveLength(1);
    expect(v[0].placeId).toBe("p1");
    expect(v[0].feedback).toBe("good");
    expect(s).toHaveLength(0);
  });

  test("👎 writes to both visited and skipped (reason=bad_feedback)", async () => {
    await markVisited(place("p2"), "bad", "food");
    const v = await listVisited();
    const s = await listSkipped();
    expect(v).toHaveLength(1);
    expect(v[0].feedback).toBe("bad");
    expect(s).toHaveLength(1);
    expect(s[0].placeId).toBe("p2");
    expect(s[0].reason).toBe("bad_feedback");
  });
});

describe("deleteVisitedMany", () => {
  test("drops bad-feedback skipped twins, leaves manual skips intact", async () => {
    await markVisited(place("good1"), "good", "food");
    await markVisited(place("bad1"), "bad", "food");
    await skipPlace(place("manual1"), "food"); // never visited, manual skip

    await deleteVisitedMany(["good1", "bad1"]);

    expect(await listVisited()).toHaveLength(0);
    const skipped = await listSkipped();
    expect(skipped).toHaveLength(1);
    expect(skipped[0].placeId).toBe("manual1");
    expect(skipped[0].reason).toBe("manual");
  });

  test("empty array is a no-op", async () => {
    await markVisited(place("p1"), "good", "food");
    await deleteVisitedMany([]);
    expect(await listVisited()).toHaveLength(1);
  });

  test("ignores ids that don't exist in either store", async () => {
    await markVisited(place("real"), "bad", "food");
    await deleteVisitedMany(["real", "ghost"]);
    expect(await listVisited()).toHaveLength(0);
    expect(await listSkipped()).toHaveLength(0);
  });
});

describe("updateVisitedFeedback", () => {
  test("👍 → 👎 creates a bad_feedback skipped entry", async () => {
    await markVisited(place("p1"), "good", "food");
    expect(await listSkipped()).toHaveLength(0);

    await updateVisitedFeedback("p1", "bad");

    const skipped = await listSkipped();
    expect(skipped).toHaveLength(1);
    expect(skipped[0].placeId).toBe("p1");
    expect(skipped[0].reason).toBe("bad_feedback");
  });

  test("👎 → 👍 removes the bad_feedback skipped entry", async () => {
    await markVisited(place("p1"), "bad", "food");
    expect(await listSkipped()).toHaveLength(1);

    await updateVisitedFeedback("p1", "good");

    expect(await listSkipped()).toHaveLength(0);
  });

  test("👎 → 👍 preserves a manual skip on the same placeId", async () => {
    // Establish a bad-feedback skip, then user manually re-skips (overwrites
    // reason → "manual"). Flipping the visited row to 👍 must NOT remove the
    // manual skip — that's an explicit user choice, separate from feedback.
    await markVisited(place("p1"), "bad", "food");
    await skipPlace(place("p1"), "food"); // overwrites reason → "manual"

    await updateVisitedFeedback("p1", "good");

    const skipped = await listSkipped();
    expect(skipped).toHaveLength(1);
    expect(skipped[0].reason).toBe("manual");
  });

  test("same-feedback call is a no-op (visitedAt unchanged)", async () => {
    await markVisited(place("p1"), "good", "food");
    const before = (await listVisited())[0];

    await updateVisitedFeedback("p1", "good");
    const after = (await listVisited())[0];

    expect(after.visitedAt).toBe(before.visitedAt);
  });

  test("missing placeId is a silent no-op", async () => {
    await updateVisitedFeedback("nonexistent", "bad");
    expect(await listVisited()).toHaveLength(0);
    expect(await listSkipped()).toHaveLength(0);
  });
});
