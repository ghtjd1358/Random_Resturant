"use client";

import { motion } from "motion/react";
import { VisitedItem } from "./VisitedItem";
import { useVisitedRecords, type VisitedFilter } from "@/hooks/useVisitedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";
import { cn } from "@/lib/utils";

const FILTERS: { key: VisitedFilter; label: string; kanji?: string }[] = [
  { key: "all", label: "전체" },
  { key: "good", label: "좋았어요 👍" },
  { key: "bad", label: "별로 👎" },
];

export function VisitedList() {
  const { records, filter, setFilter, remove, setFeedback } = useVisitedRecords();

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs value={filter} onChange={setFilter} />

      {records === null ? (
        <EmptyPlaceholder kanji="待" title="불러오는 중…" />
      ) : records.length === 0 ? (
        <EmptyPlaceholder {...emptyMessage(filter)} />
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => (
            <VisitedItem
              key={r.placeId}
              record={r}
              onFeedback={setFeedback}
              onDelete={remove}
            />
          ))}
        </ul>
      )}

      {records && records.length > 0 && (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
          <span className="size-1 rounded-full bg-torii/60" aria-hidden />
          이름을 탭하면 구글 지도에서 열려요
          <span className="size-1 rounded-full bg-torii/60" aria-hidden />
        </p>
      )}
    </div>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: VisitedFilter;
  onChange: (f: VisitedFilter) => void;
}) {
  return (
    <div className="relative flex gap-1 rounded-xl border border-border bg-card bg-washi-soft p-1">
      {FILTERS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "no-select relative flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-cream" : "text-muted-foreground hover:text-sumi",
            )}
          >
            {active && (
              <motion.span
                layoutId="visited-filter-active"
                className="absolute inset-0 rounded-lg bg-sumi shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative font-heading font-bold tracking-tight">
              {label}
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
      title: "아직 👍 준 곳이 없어요",
      hint: "좋았던 집은 두고두고 기록됩니다",
    };
  }
  return {
    kanji: "否",
    title: "아직 👎 준 곳이 없어요",
    hint: "별로였던 집은 앞으로 뽑기에 안 나와요",
  };
}
