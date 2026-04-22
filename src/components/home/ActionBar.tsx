"use client";

import { Navigation2, RotateCcw, ThumbsDown, ThumbsUp, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisitActions } from "@/hooks/useVisitActions";
import type { PlaceLite } from "@/lib/places/types";

export function ActionBar({ place }: { place: PlaceLite }) {
  const { goMap, reroll, markGood, markBad, skip } = useVisitActions(place);

  return (
    <div className="border-t border-border bg-cream-soft p-2">
      <div className="grid grid-cols-2 gap-1">
        <ActionButton label="여기로" icon={Navigation2} onClick={goMap} variant="accent" />
        <ActionButton label="다시 뽑기" icon={RotateCcw} onClick={reroll} variant="subtle" />
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1">
        <ActionButton label="좋았어요" icon={ThumbsUp} onClick={markGood} variant="good" />
        <ActionButton label="별로예요" icon={ThumbsDown} onClick={markBad} variant="bad" />
        <ActionButton label="스킵" icon={X} onClick={skip} variant="subtle" />
      </div>
    </div>
  );
}

type Variant = "accent" | "good" | "bad" | "subtle";

const VARIANT_CLASSES: Record<Variant, string> = {
  accent: "text-torii hover:bg-torii/10 hover:text-torii-deep",
  good: "text-matcha hover:bg-matcha/10 hover:text-matcha",
  bad: "text-torii/80 hover:bg-torii/10 hover:text-torii",
  subtle: "text-muted-foreground hover:bg-muted hover:text-sumi",
};

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant: Variant;
}

function ActionButton({ label, icon: Icon, onClick, variant }: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`no-select h-auto flex-col gap-0.5 rounded-lg py-2 text-[11px] font-medium ${VARIANT_CLASSES[variant]}`}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
