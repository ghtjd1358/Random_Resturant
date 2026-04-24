"use client";

import { toast } from "sonner";
import { SkippedItem } from "./SkippedItem";
import { useSkippedRecords } from "@/hooks/useSkippedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";

export function SkippedList() {
  const { records, pending, restore, restoreAll } = useSkippedRecords({
    onRestore: (r) =>
      toast.success(`${r.name} 복구했어요`, {
        description: "다시 뽑기 후보로 돌아왔어요.",
        duration: 1800,
      }),
    onResetAll: (n) => {
      if (n > 0)
        toast.success(`${n}곳을 모두 복구했어요`, { duration: 1800 });
    },
  });

  if (records === null)
    return <EmptyPlaceholder kanji="待" title="불러오는 중…" />;
  if (records.length === 0)
    return (
      <EmptyPlaceholder
        kanji="清"
        title="스킵한 가게가 없어요"
        hint="별로였거나 안 가고 싶은 곳을 제외하면 여기에 쌓여요"
      />
    );

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between border-b border-hairline-soft pb-2.5">
        <p className="flex items-baseline gap-1.5">
          <span className="font-mincho text-[15px] font-medium text-sumi-ink num-tabular">
            {records.length}
          </span>
          <span className="font-mincho text-[12px] text-sumi-mute">
            곳 제외됨
          </span>
        </p>
        <button
          type="button"
          onClick={restoreAll}
          disabled={pending}
          className="font-mincho text-[12px] tracking-tight text-shu transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          전부 복구 · 復
        </button>
      </div>

      <ul className="flex flex-col">
        {records.map((r, idx) => (
          <SkippedItem
            key={r.placeId}
            record={r}
            index={records.length - idx}
            disabled={pending}
            onRestore={() => restore(r.placeId)}
          />
        ))}
      </ul>

      <p className="font-mincho mt-3 text-center text-[11px] tracking-tight text-sumi-fade">
        ─ 여기까지 ─
      </p>
    </div>
  );
}
