"use client";

import { Star } from "lucide-react";

interface Props {
  rating?: number;
  count?: number;
}

export function RatingBadge({ rating, count }: Props) {
  if (rating == null) return null;
  return (
    <span className="flex items-center gap-1">
      <Star className="size-4 fill-torii text-torii" />
      <span className="font-heading text-base font-bold text-sumi tabular-nums">
        {rating.toFixed(1)}
      </span>
      {count != null && (
        <span className="text-xs tabular-nums text-muted-foreground">
          ({count.toLocaleString()})
        </span>
      )}
    </span>
  );
}
