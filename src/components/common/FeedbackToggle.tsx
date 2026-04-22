"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/lib/db/schema";

interface Props {
  value: Feedback;
  onChange: (next: Feedback) => void;
  size?: "sm" | "md";
}

/** Paired 👍/👎 buttons — the active one is highlighted, tap to switch. */
export function FeedbackToggle({ value, onChange, size = "md" }: Props) {
  const isGood = value === "good";
  const box =
    size === "sm" ? "size-7" : "size-8";
  const icon =
    size === "sm" ? "size-3" : "size-3.5";

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange("good")}
        aria-label="좋았어요로 변경"
        aria-pressed={isGood}
        className={cn(
          "no-select flex items-center justify-center rounded-md transition-colors",
          box,
          isGood
            ? "bg-matcha/15 text-matcha"
            : "text-muted-foreground hover:bg-muted hover:text-sumi",
        )}
      >
        <ThumbsUp className={icon} strokeWidth={isGood ? 2.5 : 1.75} />
      </button>
      <button
        onClick={() => onChange("bad")}
        aria-label="별로로 변경"
        aria-pressed={!isGood}
        className={cn(
          "no-select flex items-center justify-center rounded-md transition-colors",
          box,
          !isGood
            ? "bg-torii/15 text-torii"
            : "text-muted-foreground hover:bg-muted hover:text-sumi",
        )}
      >
        <ThumbsDown className={icon} strokeWidth={!isGood ? 2.5 : 1.75} />
      </button>
    </div>
  );
}
