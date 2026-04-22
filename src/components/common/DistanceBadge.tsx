"use client";

import { Clock, Route } from "lucide-react";
import { formatDistance, formatWalkTime } from "@/lib/format/place";

interface Props {
  meters?: number;
}

export function DistanceBadge({ meters }: Props) {
  const dist = formatDistance(meters);
  const walk = formatWalkTime(meters);
  if (!dist) return null;

  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Route className="size-3.5" />
      <span className="font-medium tabular-nums text-sumi">{dist}</span>
      {walk && (
        <>
          <span className="opacity-50">·</span>
          <Clock className="size-3" />
          <span className="text-xs">{walk}</span>
        </>
      )}
    </span>
  );
}
