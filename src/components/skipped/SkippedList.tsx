"use client";

import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SkippedItem } from "./SkippedItem";
import { useSkippedRecords } from "@/hooks/useSkippedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";

export function SkippedList() {
  const { records, pending, restore, restoreAll } = useSkippedRecords({
    onRestore: (r) =>
      toast.success(`${r.name} 복구했어요`, {
        description: "다시 뽑기 후보로 돌아왔어요.",
      }),
    onResetAll: (n) => {
      if (n > 0) toast.success(`${n}곳을 모두 복구했어요`);
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-torii/60" aria-hidden />
          <span className="font-heading font-bold tracking-tight text-sumi">
            {records.length}곳
          </span>
          제외됨
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={restoreAll}
          disabled={pending}
          className="h-7 text-xs"
        >
          <Undo2 className="mr-1 size-3" />
          전부 복구
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {records.map((r) => (
          <SkippedItem
            key={r.placeId}
            record={r}
            disabled={pending}
            onRestore={() => restore(r.placeId)}
          />
        ))}
      </ul>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
        <span className="size-1 rounded-full bg-torii/60" aria-hidden />
        이름을 탭하면 구글 지도에서 열려요
        <span className="size-1 rounded-full bg-torii/60" aria-hidden />
      </p>
    </div>
  );
}
