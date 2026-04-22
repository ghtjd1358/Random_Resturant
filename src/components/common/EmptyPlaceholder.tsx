"use client";

interface Props {
  /** Large kanji character shown as a hanko-style mark. */
  kanji?: string;
  /** Main message — use for "아직 N개 없어요" style copy. */
  title: string;
  /** Optional hint below the title. */
  hint?: string;
}

/**
 * Shared empty-state placeholder with a faint hanko accent and washi bg.
 * Cohesive with the rest of the Japanese-warm aesthetic instead of the
 * generic dashed-border grey block that most apps use.
 */
export function EmptyPlaceholder({ kanji = "空", title, hint }: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-border/70 bg-card/40 bg-washi-soft px-6 py-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted/60 font-heading text-[16px] font-bold text-muted-foreground/70"
      >
        {kanji}
      </div>
      <p className="text-[13px] font-medium leading-relaxed text-sumi-soft break-keep">
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80 break-keep">
          {hint}
        </p>
      )}
    </div>
  );
}
