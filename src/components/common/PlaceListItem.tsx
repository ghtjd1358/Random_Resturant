"use client";

import { type LucideIcon, ExternalLink, Coffee, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/places/types";

interface Props {
  name: string;
  subtitle: React.ReactNode;
  category: Category;
  icon?: LucideIcon;
  onOpen: () => void;
  /** Action slot rendered on the right — buttons, toggles, etc. */
  actions?: React.ReactNode;
}

/**
 * Shared tile for visited / skipped lists.
 * Name area is a button (opens map), right slot holds action buttons.
 */
export function PlaceListItem({
  name,
  subtitle,
  category,
  icon,
  onOpen,
  actions,
}: Props) {
  const Icon = icon ?? (category === "food" ? UtensilsCrossed : Coffee);

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-card px-3 py-3",
        "bg-washi-soft transition-all duration-200",
        "hover:border-torii/35 hover:shadow-[0_1px_2px_rgba(43,43,43,0.04),0_4px_12px_rgba(43,43,43,0.05)]",
        "active:bg-muted/30",
      )}
    >
      {/* Left accent rail — appears on hover/active as category signal */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-0 transition-opacity group-hover:opacity-100",
          category === "cafe" ? "bg-matcha" : "bg-torii",
        )}
      />

      <button
        type="button"
        onClick={onOpen}
        className="no-select flex min-w-0 flex-1 items-start gap-3 text-left"
        aria-label={`${name} 구글맵에서 열기`}
      >
        {/* Category icon — double-layered for depth */}
        <div className="relative mt-0.5 shrink-0">
          <span
            aria-hidden
            className={cn(
              "absolute -inset-0.5 rounded-lg opacity-0 transition-opacity group-hover:opacity-100",
              category === "cafe" ? "bg-matcha/10" : "bg-torii/8",
            )}
          />
          <div
            className={cn(
              "relative rounded-lg p-2 transition-colors",
              category === "cafe"
                ? "bg-matcha/10 text-matcha-deep group-hover:bg-matcha/15"
                : "bg-torii/8 text-torii group-hover:bg-torii/12",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-heading text-[15px] font-bold tracking-tight text-sumi">
              {name}
            </h3>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-torii/70" />
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {subtitle}
          </div>
        </div>
      </button>

      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </li>
  );
}
