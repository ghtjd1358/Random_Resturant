import { cn } from "@/lib/utils";

/**
 * Huge faded kanji glyph anchored to the page background — printed-paper
 * watermark feel. Uses fixed positioning so it survives scroll on tall
 * screens (History/Settings) without being clipped by overflow.
 *
 * Sits at z-0 with `pointer-events-none`, so it never interferes with
 * interactive content above. Each page picks the glyph that names it.
 */
export function KanjiWatermark({
  glyph,
  className,
}: {
  glyph: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 mx-auto max-w-[480px] overflow-hidden",
        className,
      )}
    >
      <span
        className="font-mincho absolute -right-12 bottom-32 select-none text-[22rem] font-medium leading-none text-sumi-ink/[0.04]"
        style={{ writingMode: "horizontal-tb" }}
      >
        {glyph}
      </span>
    </div>
  );
}
