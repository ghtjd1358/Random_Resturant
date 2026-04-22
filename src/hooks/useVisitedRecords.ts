"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listVisited,
  deleteVisited,
  unskipPlace,
  updateVisitedFeedback,
} from "@/lib/db/repo";
import type { Feedback, VisitedRecord } from "@/lib/db/schema";

export type VisitedFilter = "all" | Feedback;

export interface UseVisitedRecords {
  records: VisitedRecord[] | null;
  filter: VisitedFilter;
  setFilter: (f: VisitedFilter) => void;
  refresh: () => Promise<void>;
  remove: (r: VisitedRecord) => Promise<void>;
  setFeedback: (r: VisitedRecord, target: Feedback) => Promise<void>;
}

export function useVisitedRecords(): UseVisitedRecords {
  const [records, setRecords] = useState<VisitedRecord[] | null>(null);
  const [filter, setFilter] = useState<VisitedFilter>("all");

  const refresh = useCallback(async () => {
    const rows = await listVisited(
      filter === "all" ? undefined : { feedback: filter },
    );
    setRecords(rows);
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (r: VisitedRecord) => {
      await deleteVisited(r.placeId);
      if (r.feedback === "bad") await unskipPlace(r.placeId);
      await refresh();
    },
    [refresh],
  );

  const setFeedback = useCallback(
    async (r: VisitedRecord, target: Feedback) => {
      if (r.feedback === target) return;
      await updateVisitedFeedback(r.placeId, target);
      await refresh();
    },
    [refresh],
  );

  return { records, filter, setFilter, refresh, remove, setFeedback };
}
