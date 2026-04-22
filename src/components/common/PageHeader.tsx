"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  eyebrow: string;
  kanji: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Consistent page header across non-home routes. Uses the same hanko-stamp
 * language as the home header so every screen feels cohesive.
 */
export function PageHeader({
  eyebrow,
  kanji,
  title,
  subtitle,
  backHref,
  backLabel,
}: Props) {
  return (
    <header className="relative">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-sumi"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel ?? "뒤로"}
        </Link>
      )}

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="hanko size-9 text-[17px] font-bold leading-none"
        >
          {kanji}
        </span>
        <div>
          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            {eyebrow}
          </p>
          <h1 className="font-heading text-[2rem] font-bold leading-none tracking-tight text-sumi">
            {title}
          </h1>
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground break-keep">
          <span
            aria-hidden
            className="h-px w-6 bg-gradient-to-r from-sumi-soft to-transparent"
          />
          {subtitle}
        </p>
      )}
    </header>
  );
}
