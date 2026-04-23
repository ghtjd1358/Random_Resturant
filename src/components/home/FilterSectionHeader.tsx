/**
 * Filter section masthead: 類 종류 / KIND pattern.
 * Used by ModeToggle, PriceFilter, RadiusSlider, OpenNowToggle to give each
 * control group an editorial header instead of a generic label.
 */
export function FilterSectionHeader({
  kanji,
  labelKr,
  labelEn,
  trailing,
}: {
  kanji: string;
  labelKr: string;
  labelEn: string;
  /** Right-aligned content (e.g. "800 m" for the slider) */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <div className="flex items-baseline gap-2">
        <span className="font-mincho text-[14px] font-medium text-sumi-ink">
          {kanji}
        </span>
        <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
          {labelKr}
        </span>
        <span className="eyebrow text-[9px]">/ {labelEn}</span>
      </div>
      {trailing}
    </div>
  );
}
