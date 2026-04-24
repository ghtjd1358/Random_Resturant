"use client";

import { VisitedItem } from "./VisitedItem";
import { useVisitedRecords, type VisitedFilter } from "@/hooks/useVisitedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";
import { cn } from "@/lib/utils";

const FILTERS: { key: VisitedFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "good", label: "좋아요" },
  { key: "bad", label: "싫어요" },
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
        <ul className="flex flex-col">
          {records.map((r, idx) => (
            <VisitedItem
              key={r.placeId}
              record={r}
              index={records.length - idx}
              onFeedback={setFeedback}
              onDelete={remove}
            />
          ))}
        </ul>
      )}

      {records && records.length > 0 && (
        <p className="font-mincho mt-2 text-center text-[11px] tracking-tight text-sumi-fade">
          ─ 여기까지 ─
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
    <div className="flex items-baseline justify-between border-b border-hairline-soft pb-2.5">
      {FILTERS.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "no-select font-mincho text-[14px] tracking-tight transition-colors",
              active ? "text-sumi-ink" : "text-sumi-fade hover:text-sumi-mute",
            )}
          >
            <span className={active ? "border-b-2 border-shu pb-1" : ""}>
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
