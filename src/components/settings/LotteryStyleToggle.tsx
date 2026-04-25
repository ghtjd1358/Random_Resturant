"use client";

import { useLotteryStore, type LotteryStyle } from "@/stores/useLotteryStore";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

const OPTIONS: { key: LotteryStyle; kanji: string; label: string; caption: string }[] = [
  { key: "kuji", kanji: "籤", label: "제비뽑기", caption: "통 + 막대기" },
  { key: "yabawi", kanji: "椀", label: "야바위", caption: "3-그릇 셔플" },
];

/**
 * Settings row that lets the user pick between the two lottery animation
 * metaphors. Mirrors DiceStyleToggle's layout so settings list reads as a
 * coherent set of "appearance" choices.
 */
export function LotteryStyleToggle() {
  const style = useLotteryStore((s) => s.style);
  const setStyle = useLotteryStore((s) => s.setStyle);

  return (
    <li className="py-3.5">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
            뽑기 방식
          </p>
          <p className="mt-0.5 text-[11px] text-sumi-fade">
            제비 탭 모달의 3D 애니메이션
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="뽑기 방식" className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ key, kanji, label, caption }) => {
          const active = style === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (style !== key) {
                  haptic.select();
                  setStyle(key);
                }
              }}
              className={cn(
                "no-select relative flex flex-col items-start border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-sumi-ink bg-paper-soft"
                  : "border-hairline bg-paper hover:border-sumi-ink/40",
              )}
            >
              {active && <span aria-hidden className="shu-tab" />}
              <span className="flex items-baseline gap-1.5">
                <span className="font-mincho text-[15px] text-sumi-ink">
                  {kanji}
                </span>
                <span className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
                  {label}
                </span>
              </span>
              <span className="font-mincho mt-0.5 text-[10px] text-sumi-fade">
                {caption}
              </span>
            </button>
          );
        })}
      </div>
    </li>
  );
}
