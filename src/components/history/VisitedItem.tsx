"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildMapUrl } from "@/lib/places/mapUrl";
import { formatVisitDate } from "@/lib/format/time";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import type { Feedback, VisitedRecord } from "@/lib/db/schema";

interface Props {
  record: VisitedRecord;
  /** 1-based row number rendered as 01, 02 ... — matches editorial style */
  index: number;
  onFeedback: (record: VisitedRecord, target: Feedback) => void;
  onDelete: (record: VisitedRecord) => void;
}

export function VisitedItem({ record, index, onFeedback, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    haptic.tap();
    const url = buildMapUrl({
      placeId: record.placeId,
      name: record.name,
      googleMapsUri: record.googleMapsUri,
      lat: record.lat,
      lng: record.lng,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFeedback = (target: Feedback) => {
    if (record.feedback === target) return;
    if (target === "good") haptic.positive();
    else haptic.negative();
    onFeedback(record, target);
    toast.success(
      target === "good" ? "좋아요로 바꿨어요" : "싫어요로 바꿨어요",
      { duration: 1800 },
    );
  };

  const handleDelete = () => {
    haptic.tap();
    onDelete(record);
    toast.success("기록을 삭제했어요.", { duration: 1800 });
    setOpen(false);
  };

  return (
    <li className="border-b border-hairline-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="no-select flex w-full items-start gap-3 py-4 text-left transition-colors active:bg-sumi-ink/5"
      >
        <span className="font-mincho mt-0.5 w-[22px] shrink-0 text-[12px] num-tabular text-sumi-fade">
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-mincho text-[15px] font-medium tracking-tight text-sumi-ink">
            {record.name}
          </h3>
          <p className="mt-0.5 text-[11px] text-sumi-fade num-tabular">
            {formatVisitDate(record.visitedAt)}
          </p>
        </div>
        <FeedbackStamp feedback={record.feedback} />
      </button>

      {open && (
        <div className="flex items-center gap-3 border-t border-hairline-soft py-2.5 text-[11px]">
          <button
            type="button"
            onClick={handleOpen}
            className="font-mincho text-sumi-mute transition-opacity hover:opacity-70"
          >
            지도에서 열기
          </button>
          <span className="hairline-soft h-3 w-px" />
          <button
            type="button"
            onClick={() => handleFeedback("good")}
            className={cn(
              "font-mincho transition-opacity hover:opacity-70",
              record.feedback === "good" ? "text-sumi-ink" : "text-sumi-mute",
            )}
          >
            好 좋아요
          </button>
          <button
            type="button"
            onClick={() => handleFeedback("bad")}
            className={cn(
              "font-mincho transition-opacity hover:opacity-70",
              record.feedback === "bad" ? "text-sumi-ink" : "text-sumi-mute",
            )}
          >
            否 싫어요
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="기록 삭제"
            className="ml-auto inline-flex items-center gap-1 text-shu transition-opacity hover:opacity-70"
          >
            <Trash2 className="size-3" />
            삭제
          </button>
        </div>
      )}
    </li>
  );
}

function FeedbackStamp({ feedback }: { feedback: Feedback }) {
  if (feedback === "good") {
    return (
      <span className="hanko-square shrink-0" aria-label="좋아요">
        好
      </span>
    );
  }
  return (
    <span
      className="hanko-square hanko-square-shu shrink-0"
      aria-label="싫어요"
    >
      不
    </span>
  );
}
