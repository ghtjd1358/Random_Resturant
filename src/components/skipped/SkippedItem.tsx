"use client";

import { useState } from "react";
import { buildMapUrl } from "@/lib/places/mapUrl";
import { formatShortDate } from "@/lib/format/time";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import type { SkippedRecord } from "@/lib/db/schema";

interface Props {
  record: SkippedRecord;
  /** 1-based row number rendered as 01, 02 ... — matches History style */
  index: number;
  disabled?: boolean;
  onRestore: () => void;
}

export function SkippedItem({ record, index, disabled, onRestore }: Props) {
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

  const reasonLabel =
    record.reason === "bad_feedback" ? "否 싫어요" : "手動 수동 스킵";

  return (
    <li className="border-b border-hairline-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="no-select flex w-full items-start gap-3 py-4 text-left transition-colors active:bg-sumi-ink/5"
      >
        <span className="font-mincho mt-0.5 w-[18px] shrink-0 text-[13px] num-tabular text-sumi-fade">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-mincho text-[15px] font-medium tracking-tight text-sumi-ink">
            {record.name}
          </h3>
          <p className="mt-0.5 font-mincho text-[11px] text-sumi-fade">
            {reasonLabel}
            <span className="mx-1.5 text-sumi-fade/60">·</span>
            <span className="num-tabular">
              {formatShortDate(record.skippedAt)}
            </span>
          </p>
        </div>
        <span
          className="hanko-square hanko-square-shu shrink-0"
          aria-label="제외됨"
        >
          不
        </span>
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
            onClick={onRestore}
            disabled={disabled}
            className={cn(
              "font-mincho ml-auto text-shu transition-opacity hover:opacity-70 disabled:opacity-40",
            )}
          >
            復 복구
          </button>
        </div>
      )}
    </li>
  );
}
