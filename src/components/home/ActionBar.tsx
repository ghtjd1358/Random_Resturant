"use client";

import { useVisitActions } from "@/hooks/useVisitActions";
import { cn } from "@/lib/utils";
import type { PlaceLite } from "@/lib/places/types";

export function ActionBar({ place }: { place: PlaceLite }) {
  const { goMap, reroll, markGood, markBad, skip, share } = useVisitActions(place);

  return (
    <div className="border-t border-hairline">
      {/* Primary row — text-only editorial actions */}
      <div className="grid grid-cols-4 divide-x divide-hairline-soft">
        <TextAction label="길찾기" onClick={goMap} />
        <TextAction label="공유" onClick={share} />
        <TextAction label="패스" onClick={skip} />
        <TextAction label="다시 굴리기" onClick={reroll} accent />
      </div>
      {/* Feedback row — quieter, sits below primary */}
      <div className="grid grid-cols-2 divide-x divide-hairline-soft border-t border-hairline-soft">
        <TextAction label="好 또 갈래요" onClick={markGood} />
        <TextAction label="否 별로였어요" onClick={markBad} />
      </div>
    </div>
  );
}

function TextAction({
  label,
  onClick,
  accent = false,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "no-select font-mincho py-3 text-[12px] tracking-tight transition-colors",
        accent ? "text-shu hover:bg-shu/5" : "text-sumi-mute hover:bg-sumi-ink/5 hover:text-sumi-ink",
      )}
    >
      {label}
    </button>
  );
}
