"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlaceListItem } from "@/components/common/PlaceListItem";
import { FeedbackToggle } from "@/components/common/FeedbackToggle";
import { buildMapUrl } from "@/lib/places/mapUrl";
import { formatVisitDate } from "@/lib/format/time";
import { haptic } from "@/lib/haptic";
import type { Feedback, VisitedRecord } from "@/lib/db/schema";

interface Props {
  record: VisitedRecord;
  onFeedback: (record: VisitedRecord, target: Feedback) => void;
  onDelete: (record: VisitedRecord) => void;
}

export function VisitedItem({ record, onFeedback, onDelete }: Props) {
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
      target === "good" ? "👍 좋았음으로 바꿨어요" : "👎 별로로 바꿨어요",
      {
        description:
          target === "bad"
            ? "다시 뽑기에 안 나오게 스킵도 했어요."
            : "다시 뽑기 후보로도 돌아왔어요.",
      },
    );
  };

  const handleDelete = () => {
    haptic.tap();
    onDelete(record);
    toast.success("기록을 삭제했어요.");
  };

  return (
    <PlaceListItem
      name={record.name}
      subtitle={formatVisitDate(record.visitedAt)}
      category={record.category}
      onOpen={handleOpen}
      actions={
        <>
          <FeedbackToggle
            value={record.feedback}
            onChange={handleFeedback}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            className="ml-1 size-8 text-muted-foreground hover:text-torii"
            aria-label="기록 삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </>
      }
    />
  );
}
