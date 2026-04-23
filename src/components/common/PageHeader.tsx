"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  eyebrow: string;
  kanji: string;
  /** Korean main title — e.g. "방문 기록" */
  title: string;
  /** JP small line shown above the title (mincho); accepts JSX for "한국어 / EN" pairs */
  jpLabel?: React.ReactNode;
  /** 朱 round seal label (1-2 kanji), e.g. "訪問" */
  sealKanji?: string;
  sealRomaji?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  /** Right-side meta line (e.g. "모두 5곳") shown next to jpLabel */
  meta?: React.ReactNode;
}

/**
 * Editorial masthead shared by non-home routes. Mirrors HomeHeader so the
 * whole app reads as one publication.
 */
export function PageHeader({
  eyebrow,
  kanji,
  title,
  jpLabel,
  sealKanji,
  sealRomaji,
  subtitle,
  backHref,
  backLabel,
  meta,
}: Props) {
  return (
    <header className="relative">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-sumi-fade transition-colors hover:text-sumi-ink"
        >
          <ChevronLeft className="size-3.5" />
          {backLabel ?? "뒤로"}
        </Link>
      )}

      {/* Eyebrow row: kanji square + jp label + right meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="hanko-square hanko-square-shu" aria-hidden>
            {kanji}
          </span>
          {jpLabel && (
            <span className="eyebrow-strong text-sumi-mute">
              {jpLabel}
            </span>
          )}
        </div>
        {meta && <span className="eyebrow num-tabular">{meta}</span>}
      </div>

      {/* Title + 朱 round seal */}
      <div className="relative mt-3 flex items-end justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-1 text-sumi-fade">{eyebrow}</p>
          )}
          <h1 className="font-mincho text-[2.4rem] font-medium leading-none tracking-tight text-sumi-ink">
            {title}
          </h1>
        </div>

        {sealKanji && (
          <span
            className="hanko-round size-[54px] shrink-0 flex-col gap-0 leading-none"
            aria-hidden
          >
            <span className="text-[15px]">{sealKanji}</span>
            {sealRomaji && (
              <span className="mt-0.5 text-[7px] tracking-[0.2em] text-shu/70">
                {sealRomaji}
              </span>
            )}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-3 text-[13px] leading-relaxed text-sumi-mute break-keep">
          {subtitle}
        </p>
      )}

      <div className="hairline mt-4" />
    </header>
  );
}
