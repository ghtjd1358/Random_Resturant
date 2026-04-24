"use client";

import { useDiceStyleStore, type DiceStyle } from "@/stores/useDiceStyleStore";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

// Default (rotating) goes first so it sits on the left — matches the
// store's default and reads as "this is what you'd get out of the box".
const OPTIONS: { key: DiceStyle; label: string; caption: string }[] = [
  { key: "rotating", label: "한자 굴리기", caption: "麺·寿·茶… 회전" },
  { key: "classic", label: "選 고정", caption: "조용한 도장" },
];

/**
 * Settings row that lets the user pick between two dice button styles.
 * Lives inside the settings list as a self-contained <li>.
 */
export function DiceStyleToggle() {
  const style = useDiceStyleStore((s) => s.style);
  const setStyle = useDiceStyleStore((s) => s.setStyle);

  return (
    <li className="py-3.5">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
            주사위 스타일
          </p>
          <p className="mt-0.5 text-[11px] text-sumi-fade">
            홈 화면 「選」 버튼 표시 방식
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="주사위 스타일" className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ key, label, caption }) => {
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
              <span className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
                {label}
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
