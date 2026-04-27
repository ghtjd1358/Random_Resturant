"use client";

import { useState } from "react";
import { Check, ExternalLink, Trash2 } from "lucide-react";
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
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (placeId: string) => void;
}

export function VisitedItem({
  record,
  index,
  onFeedback,
  onDelete,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  // Render guard `!selectMode && open` keeps the detail panel hidden during
  // select mode without resetting `open`; on exit, the panel reverts to its
  // last user-driven state (which is what users expect).

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

  const handleRowClick = () => {
    if (selectMode) {
      haptic.select();
      onToggleSelect?.(record.placeId);
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <li className="border-b border-hairline-soft">
      <button
        type="button"
        onClick={handleRowClick}
        aria-pressed={selectMode ? selected : undefined}
        className="no-select flex w-full items-start gap-3 py-4 text-left transition-colors active:bg-sumi-ink/5"
      >
        {selectMode ? (
          <SelectBox checked={selected} />
        ) : (
          <span className="font-mincho mt-0.5 w-[22px] shrink-0 text-[12px] num-tabular text-sumi-fade">
            {String(index).padStart(2, "0")}
          </span>
        )}
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

      {!selectMode && open && (
        <div className="flex items-center gap-3 border-t border-hairline-soft py-2.5 text-[11px]">
          <button
            type="button"
            onClick={handleOpen}
            className="font-mincho inline-flex items-center gap-1 text-sumi-mute transition-opacity hover:opacity-70"
          >
            지도에서 열기
            <ExternalLink className="size-3" strokeWidth={1.5} />
          </button>
          <span className="hairline-soft h-3 w-px" />
          <FeedbackButton
            label="好 좋아요"
            target="good"
            current={record.feedback}
            onClick={() => handleFeedback("good")}
          />
          <FeedbackButton
            label="否 싫어요"
            target="bad"
            current={record.feedback}
            onClick={() => handleFeedback("bad")}
          />
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

/**
 * The button that matches the row's *current* feedback is rendered as
 * disabled — clipped opacity, no hover, default cursor — so users on the
 * 싫어요 page don't tap "否 싫어요" expecting something to happen. The
 * opposite-state button is the only actionable one.
 */
function FeedbackButton({
  label,
  target,
  current,
  onClick,
}: {
  label: string;
  target: Feedback;
  current: Feedback;
  onClick: () => void;
}) {
  const isCurrent = current === target;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCurrent}
      aria-pressed={isCurrent}
      className={cn(
        "font-mincho transition-opacity",
        isCurrent
          ? "cursor-default text-sumi-fade opacity-40"
          : "text-sumi-mute hover:opacity-70",
      )}
    >
      {label}
    </button>
  );
}

function SelectBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center border transition-colors",
        checked
          ? "border-sumi-ink bg-sumi-ink text-paper"
          : "border-hairline bg-paper",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={2.5} />}
    </span>
  );
}

function FeedbackStamp({ feedback }: { feedback: Feedback }) {
  // Filled variants — outline-only stamps were too easy to mistake for each
  // other while scanning the 전체 list. Matcha green = good, shu red = bad.
  if (feedback === "good") {
    return (
      <span
        className="hanko-square hanko-square-good-filled shrink-0"
        aria-label="좋아요"
      >
        好
      </span>
    );
  }
  return (
    <span
      className="hanko-square hanko-square-bad-filled shrink-0"
      aria-label="싫어요"
    >
      不
    </span>
  );
}
