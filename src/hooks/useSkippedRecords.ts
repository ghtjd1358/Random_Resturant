"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { listSkipped, resetSkipped, unskipPlace } from "@/lib/db/repo";
import type { SkippedRecord } from "@/lib/db/schema";

export interface UseSkippedRecords {
  records: SkippedRecord[] | null;
  pending: boolean;
  refresh: () => Promise<void>;
  restore: (placeId: string) => void;
  restoreAll: () => void;
}

/**
 * onRestore/onResetAll receive post-action counts to drive user-facing toast
 * messaging without coupling this hook to the toast library.
 */
export function useSkippedRecords(handlers?: {
  onRestore?: (record: SkippedRecord) => void;
  onResetAll?: (count: number) => void;
}): UseSkippedRecords {
  const [records, setRecords] = useState<SkippedRecord[] | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const rows = await listSkipped();
    setRecords(rows);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = useCallback(
    (placeId: string) => {
      startTransition(async () => {
        const target = records?.find((r) => r.placeId === placeId);
        await unskipPlace(placeId);
        if (target) handlers?.onRestore?.(target);
        await refresh();
      });
    },
    [records, refresh, handlers],
  );

  const restoreAll = useCallback(() => {
    startTransition(async () => {
      const n = await resetSkipped();
      handlers?.onResetAll?.(n);
      await refresh();
    });
  }, [refresh, handlers]);

  return { records, pending, refresh, restore, restoreAll };
}
