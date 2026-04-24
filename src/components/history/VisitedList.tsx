"use client";

import { useMemo } from "react";
import { VisitedItem } from "./VisitedItem";
import {
  useVisitedRecords,
  type VisitedCounts,
  type VisitedFilter,
} from "@/hooks/useVisitedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";
import { cn } from "@/lib/utils";

const FILTERS: { key: VisitedFilter; kanji: string; label: string }[] = [
  { key: "all", kanji: "全", label: "전체" },
  { key: "good", kanji: "好", label: "좋아요" },
  { key: "bad", kanji: "否", label: "싫어요" },
];

export function VisitedList() {
  const { records, counts, filter, setFilter, remove, setFeedback } =
    useVisitedRecords();

  // listVisited returns DESC (newest first). User asked for ASC display so
  // 1 = oldest visit. Reverse a copy on the client.
  const sortedRecords = useMemo(
    () => (records ? [...records].reverse() : null),
    [records],
  );

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs value={filter} counts={counts} onChange={setFilter} />

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
            />
          ))}
        </ul>
      )}

      {sortedRecords && sortedRecords.length > 0 && (
        <p className="font-mincho mt-2 text-center text-[11px] tracking-tight text-sumi-fade">
          ─ 여기까지 ─
        </p>
      )}
    </div>
  );
}

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

function emptyMessage(filter: VisitedFilter): {
  kanji: string;
  title: string;
  hint?: string;
} {
  if (filter === "all") {
    return {
      kanji: "初",
      title: "아직 방문 기록이 없어요",
      hint: "첫 한 집을 뽑아서 다녀와 보세요",
    };
  }
  if (filter === "good") {
    return {
      kanji: "善",
      title: "아직 또 갈래요 한 곳이 없어요",
      hint: "좋았던 집은 두고두고 기록됩니다",
    };
  }
  return {
    kanji: "否",
    title: "아직 별로였어요 한 곳이 없어요",
    hint: "별로였던 집은 앞으로 뽑기에 안 나와요",
  };
}
