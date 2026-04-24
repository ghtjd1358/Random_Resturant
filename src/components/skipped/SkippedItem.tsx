"use client";

import { Ban, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceListItem } from "@/components/common/PlaceListItem";
import { buildMapUrl } from "@/lib/places/mapUrl";
import { formatShortDate } from "@/lib/format/time";
import { haptic } from "@/lib/haptic";
import type { SkippedRecord } from "@/lib/db/schema";

interface Props {
  record: SkippedRecord;
  disabled?: boolean;
  onRestore: () => void;
}

export function SkippedItem({ record, disabled, onRestore }: Props) {
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

  const subtitle = (
    <span className="flex items-center gap-1">
      <Ban className="size-3" />
      {record.reason === "bad_feedback" ? "否 피드백" : "수동 스킵"}
      <span className="mx-1">·</span>
      {formatShortDate(record.skippedAt)}
    </span>
  );

  return (
    <PlaceListItem
      name={record.name}
      subtitle={subtitle}
      category={record.category}
      onOpen={handleOpen}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={onRestore}
          disabled={disabled}
          className="h-8 shrink-0 text-xs"
        >
          <Undo2 className="mr-1 size-3" />
          복구
        </Button>
      }
    />
  );
}
