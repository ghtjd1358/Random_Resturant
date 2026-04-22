"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function OpenNowToggle({ value, onChange }: Props) {
  const handle = () => {
    haptic.select();
    onChange(!value);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={handle}
      className={cn(
        "no-select group flex items-center justify-between rounded-xl border bg-card px-4 py-2.5 text-sm transition-all",
        value
          ? "border-matcha/40 bg-matcha/8 text-matcha-deep"
          : "border-border bg-washi-soft text-muted-foreground hover:border-border/80",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-colors",
            value
              ? "bg-matcha/15 text-matcha-deep"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Clock className="size-3.5" strokeWidth={2.25} />
        </span>
        <span
          className={cn(
            "font-heading text-[13px] font-bold tracking-tight",
            value ? "text-matcha-deep" : "text-sumi-soft",
          )}
        >
          지금 영업 중만
        </span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          value ? "bg-matcha" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute inline-block size-4 transform rounded-full bg-cream shadow-sm transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
