"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listVisited,
  deleteVisited,
  deleteVisitedMany,
  clearAllVisited,
  unskipPlace,
  updateVisitedFeedback,
} from "@/lib/db/repo";
import type { Feedback, VisitedRecord } from "@/lib/db/schema";

export type VisitedFilter = "all" | Feedback;

export interface VisitedCounts {
  all: number;
  good: number;
  bad: number;
}

export interface UseVisitedRecords {
  /** Records after the active filter is applied. */
  records: VisitedRecord[] | null;
  /** Always-true totals across every feedback bucket — independent of the
   *  current filter. Powers the tab badges so they stay accurate when the
   *  user is viewing only one bucket. */
  counts: VisitedCounts | null;
  filter: VisitedFilter;
  setFilter: (f: VisitedFilter) => void;
  refresh: () => Promise<void>;
  remove: (r: VisitedRecord) => Promise<void>;
  removeMany: (placeIds: string[]) => Promise<void>;
  removeAll: () => Promise<void>;
  setFeedback: (r: VisitedRecord, target: Feedback) => Promise<void>;
}

export function useVisitedRecords(): UseVisitedRecords {
  // Always hold the full set; filtering happens client-side so the count
  // bar stays accurate regardless of which tab is active.
  const [allRecords, setAllRecords] = useState<VisitedRecord[] | null>(null);
  const [filter, setFilter] = useState<VisitedFilter>("all");

  const refresh = useCallback(async () => {
    const rows = await listVisited(); // no DB-level filter
    setAllRecords(rows);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const records = useMemo(() => {
    if (allRecords === null) return null;
    return filter === "all"
      ? allRecords
      : allRecords.filter((r) => r.feedback === filter);
  }, [allRecords, filter]);

  const counts = useMemo<VisitedCounts | null>(() => {
    if (allRecords === null) return null;
    let good = 0;
    let bad = 0;
    for (const r of allRecords) {
      if (r.feedback === "good") good++;
      else if (r.feedback === "bad") bad++;
    }
    return { all: allRecords.length, good, bad };
  }, [allRecords]);

  const remove = useCallback(
    async (r: VisitedRecord) => {
      await deleteVisited(r.placeId);
      if (r.feedback === "bad") await unskipPlace(r.placeId);
      await refresh();
    },
    [refresh],
  );

  const removeMany = useCallback(
    async (placeIds: string[]) => {
      await deleteVisitedMany(placeIds);
      await refresh();
    },
    [refresh],
  );

  const removeAll = useCallback(async () => {
    await clearAllVisited();
    await refresh();
  }, [refresh]);

  const setFeedback = useCallback(
    async (r: VisitedRecord, target: Feedback) => {
      if (r.feedback === target) return;
      await updateVisitedFeedback(r.placeId, target);
      await refresh();
    },
    [refresh],
  );

  return {
    records,
    counts,
    filter,
    setFilter,
    refresh,
    remove,
    removeMany,
    removeAll,
    setFeedback,
  };
}
