"use client";

import {
  Navigation2,
  Share2,
  X,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  type LucideIcon,
} from "lucide-react";
import { useVisitActions } from "@/hooks/useVisitActions";
import { cn } from "@/lib/utils";
import type { PlaceLite } from "@/lib/places/types";

export function ActionBar({ place }: { place: PlaceLite }) {
  const { goMap, reroll, markGood, markBad, skip, share } = useVisitActions(place);

  return (
    <div className="border-t border-hairline">
      {/* Primary row — icon + label, editorial text style */}
      <div className="grid grid-cols-4 divide-x divide-hairline-soft">
        <TextAction icon={Navigation2} label="길찾기" onClick={goMap} />
        <TextAction icon={Share2} label="공유" onClick={share} />
        <TextAction icon={X} label="패스" onClick={skip} />
        <TextAction icon={RotateCcw} label="다시 굴리기" onClick={reroll} accent />
      </div>
      {/* Feedback row — quieter, sits below primary */}
      <div className="grid grid-cols-2 divide-x divide-hairline-soft border-t border-hairline-soft">
        <TextAction icon={ThumbsUp} label="好 또 갈래요" onClick={markGood} />
        <TextAction icon={ThumbsDown} label="否 별로였어요" onClick={markBad} />
      </div>
    </div>
  );
}

function TextAction({
  icon: Icon,
  label,
  onClick,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "no-select flex flex-col items-center gap-1 py-3 transition-colors",
        accent ? "text-shu hover:bg-shu/5" : "text-sumi-mute hover:bg-sumi-ink/5 hover:text-sumi-ink",
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.5} />
      <span className="font-mincho text-[11px] tracking-tight">{label}</span>
    </button>
  );
}
