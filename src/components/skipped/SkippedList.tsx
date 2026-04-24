"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SkippedItem } from "./SkippedItem";
import { useSkippedRecords } from "@/hooks/useSkippedRecords";
import { EmptyPlaceholder } from "@/components/common/EmptyPlaceholder";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function SkippedList() {
  const [confirmOpen, setConfirmOpen] = useState(false);
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
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
          className="font-mincho text-[12px] tracking-tight text-shu transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          전부 복구 · 復
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          showCloseButton={false}
          className="border border-hairline bg-paper-soft p-0 ring-0"
        >
          <div className="relative px-6 pt-6 pb-5">
            <span aria-hidden className="shu-tab" />
            <div className="flex items-baseline gap-2">
              <span className="font-mincho text-[15px] font-medium text-sumi-ink">
                復
              </span>
              <span className="eyebrow text-[10px]">CONFIRM</span>
            </div>
            <DialogTitle className="font-mincho mt-3 text-[1.4rem] font-medium leading-tight tracking-tight text-sumi-ink">
              모두 복구할까요?
            </DialogTitle>
            <p className="mt-2 text-[12.5px] leading-relaxed text-sumi-mute break-keep">
              차단해 둔{" "}
              <span className="font-mincho text-sumi-ink num-tabular">
                {records?.length ?? 0}곳
              </span>
              이 다시 뽑기 후보로 돌아옵니다. 한 번에 되돌립니다.
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
                  onClick={restoreAll}
                  className="font-mincho py-3 text-[13px] tracking-tight text-shu transition-colors hover:bg-shu/5"
                >
                  復 전부 복구
                </button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>

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
