"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { VisitedItem } from "./VisitedItem";
import {
  useVisitedRecords,
  type VisitedCounts,
  type VisitedFilter,
} from "@/hooks/useVisitedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

const FILTERS: { key: VisitedFilter; kanji: string; label: string }[] = [
  { key: "all", kanji: "全", label: "전체" },
  { key: "good", kanji: "好", label: "좋아요" },
  { key: "bad", kanji: "否", label: "싫어요" },
];

type ConfirmKind = "all" | "many" | null;

export function VisitedList() {
  const {
    records,
    counts,
    filter,
    setFilter,
    remove,
    removeMany,
    removeAll,
    setFeedback,
  } = useVisitedRecords();

  // Per-row newest-first stays in repo; user-facing list is oldest-first so
  // index "01" is the first visit of the trip.
  const sortedRecords = useMemo(
    () => (records ? [...records].reverse() : null),
    [records],
  );

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  // Filter switch resets selection — otherwise users carry invisible bad-row
  // selections into 좋아요 view and trigger surprise deletions.
  const handleFilterChange = useCallback(
    (next: VisitedFilter) => {
      if (next === filter) return;
      haptic.tap();
      setFilter(next);
      setSelectMode(false);
      setSelected(new Set());
    },
    [filter, setFilter],
  );

  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const toggleSelect = useCallback((placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }, []);

  const visibleIds = useMemo(
    () => sortedRecords?.map((r) => r.placeId) ?? [],
    [sortedRecords],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleSelectAllVisible = useCallback(() => {
    haptic.select();
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  // No auto-exit effect needed — both delete handlers already call
  // exitSelect() after success, and filter switching does the same.

  const handleDeleteAll = useCallback(async () => {
    const n = counts?.all ?? 0;
    await removeAll();
    exitSelect();
    if (n > 0) toast.success(`${n}건의 기록을 모두 삭제했어요`, { duration: 1800 });
  }, [counts, removeAll, exitSelect]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await removeMany(ids);
    exitSelect();
    toast.success(`${ids.length}건을 삭제했어요`, { duration: 1800 });
  }, [selected, removeMany, exitSelect]);

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs value={filter} counts={counts} onChange={handleFilterChange} />

      {sortedRecords && sortedRecords.length > 0 && (
        <ActionBar
          selectMode={selectMode}
          selectedCount={selected.size}
          allVisibleSelected={allVisibleSelected}
          totalVisible={visibleIds.length}
          onEnterSelect={() => {
            haptic.tap();
            setSelectMode(true);
          }}
          onExitSelect={() => {
            haptic.tap();
            exitSelect();
          }}
          onToggleSelectAll={toggleSelectAllVisible}
          onAskDeleteAll={() => {
            haptic.tap();
            setConfirm("all");
          }}
          onAskDeleteSelected={() => {
            if (selected.size === 0) return;
            haptic.tap();
            setConfirm("many");
          }}
        />
      )}

      {sortedRecords === null ? (
        <EmptyPlaceholder kanji="待" title="불러오는 중…" />
      ) : sortedRecords.length === 0 ? (
        <EmptyPlaceholder {...emptyMessage(filter)} />
      ) : (
        <ul className="flex flex-col">
          {sortedRecords.map((r, idx) => (
            <VisitedItem
              key={r.placeId}
              record={r}
              index={idx + 1}
              onFeedback={setFeedback}
              onDelete={remove}
              selectMode={selectMode}
              selected={selected.has(r.placeId)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </ul>
      )}

      {sortedRecords && sortedRecords.length > 0 && (
        <p className="font-mincho mt-2 text-center text-[11px] tracking-tight text-sumi-fade">
          ─ 여기까지 ─
        </p>
      )}

      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="border border-hairline bg-paper-soft p-0 ring-0"
        >
          <div className="relative px-6 pt-6 pb-5">
            <span aria-hidden className="shu-tab" />
            <div className="flex items-baseline gap-2">
              <span className="font-mincho text-[15px] font-medium text-sumi-ink">
                削
              </span>
              <span className="eyebrow text-[10px]">CONFIRM</span>
            </div>
            <DialogTitle className="font-mincho mt-3 text-[1.4rem] font-medium leading-tight tracking-tight text-sumi-ink">
              {confirm === "all" ? "기록을 모두 지울까요?" : "선택한 기록을 지울까요?"}
            </DialogTitle>
            <p className="mt-2 text-[12.5px] leading-relaxed text-sumi-mute break-keep">
              {confirm === "all" ? (
                <>
                  지금까지 쌓인{" "}
                  <span className="font-mincho text-sumi-ink num-tabular">
                    {counts?.all ?? 0}곳
                  </span>
                  의 방문 기록이 모두 사라집니다. 되돌릴 수 없어요.
                </>
              ) : (
                <>
                  선택한{" "}
                  <span className="font-mincho text-sumi-ink num-tabular">
                    {selected.size}곳
                  </span>
                  의 기록을 지웁니다. 되돌릴 수 없어요.
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-hairline-soft border-t border-hairline">
            <DialogClose
              render={
                <button
                  type="button"
                  className="font-mincho py-3 text-[13px] tracking-tight text-sumi-mute transition-colors hover:bg-sumi-ink/5 hover:text-sumi-ink"
                >
                  취소
                </button>
              }
            />
            <DialogClose
              render={
                <button
                  type="button"
                  onClick={() => {
                    if (confirm === "all") handleDeleteAll();
                    else if (confirm === "many") handleDeleteSelected();
                  }}
                  className="font-mincho py-3 text-[13px] tracking-tight text-shu transition-colors hover:bg-shu/5"
                >
                  削 삭제
                </button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function FilterTabs({
  value,
  counts,
  onChange,
}: {
  value: VisitedFilter;
  counts: VisitedCounts | null;
  onChange: (f: VisitedFilter) => void;
}) {
  return (
    <div className="flex items-baseline gap-5 border-b border-hairline-soft pb-2.5">
      {FILTERS.map(({ key, kanji, label }) => {
        const active = value === key;
        const n = counts?.[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "no-select font-mincho text-[14px] tracking-tight transition-colors",
              active ? "text-sumi-ink" : "text-sumi-fade hover:text-sumi-mute",
            )}
          >
            <span className={cn("inline-flex items-baseline gap-1.5", active ? "border-b-2 border-shu pb-1" : "")}>
              <span className={cn("text-[13px]", active ? "text-shu" : "text-sumi-fade")}>
                {kanji}
              </span>
              <span>{label}</span>
              {n !== undefined && (
                <span
                  className={cn(
                    "text-[11px] num-tabular",
                    active ? "text-sumi-mute" : "text-sumi-fade/70",
                  )}
                >
                  {n}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ActionBar({
  selectMode,
  selectedCount,
  allVisibleSelected,
  totalVisible,
  onEnterSelect,
  onExitSelect,
  onToggleSelectAll,
  onAskDeleteAll,
  onAskDeleteSelected,
}: {
  selectMode: boolean;
  selectedCount: number;
  allVisibleSelected: boolean;
  totalVisible: number;
  onEnterSelect: () => void;
  onExitSelect: () => void;
  onToggleSelectAll: () => void;
  onAskDeleteAll: () => void;
  onAskDeleteSelected: () => void;
}) {
  if (!selectMode) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-hairline-soft pb-2.5">
        <button
          type="button"
          onClick={onEnterSelect}
          className="font-mincho text-[12px] tracking-tight text-sumi-mute transition-opacity hover:opacity-70"
        >
          選 · 선택
        </button>
        <button
          type="button"
          onClick={onAskDeleteAll}
          className="font-mincho text-[12px] tracking-tight text-shu transition-opacity hover:opacity-70"
        >
          削 · 전체 삭제
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline-soft pb-2.5">
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="font-mincho text-[12px] tracking-tight text-sumi-mute transition-opacity hover:opacity-70"
      >
        {allVisibleSelected ? "全 · 전체 해제" : "全 · 전체 선택"}
        <span className="ml-1.5 num-tabular text-sumi-fade">
          {selectedCount}/{totalVisible}
        </span>
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAskDeleteSelected}
          disabled={selectedCount === 0}
          className="font-mincho text-[12px] tracking-tight text-shu transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          削 · 선택 삭제
          <span className="ml-1 num-tabular">({selectedCount})</span>
        </button>
        <span className="hairline-soft h-3 w-px" />
        <button
          type="button"
          onClick={onExitSelect}
          className="font-mincho text-[12px] tracking-tight text-sumi-mute transition-opacity hover:opacity-70"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function emptyMessage(filter: VisitedFilter): {
  kanji?: string;
  title: string;
  hint?: string;
  mascot?: import("@/components/common/Mascot").MascotVariant;
} {
  if (filter === "all") {
    return {
      mascot: "butterfly",
      title: "아직 방문 기록이 없어요",
      hint: "첫 한 집을 뽑아서 다녀와 보세요",
    };
  }
  if (filter === "good") {
    return {
      mascot: "book-read",
      title: "아직 또 갈래요 한 곳이 없어요",
      hint: "좋았던 집은 두고두고 기록됩니다",
    };
  }
  return {
    mascot: "meditate",
    title: "아직 별로였어요 한 곳이 없어요",
    hint: "별로였던 집은 앞으로 뽑기에 안 나와요",
  };
}
