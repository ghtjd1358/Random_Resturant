"use client";

import { useState, useSyncExternalStore } from "react";
import { Plane } from "lucide-react";
import { useShibuyaStore } from "@/stores/useShibuyaStore";

// Returns true only after client hydration — avoids a flash between the
// default (sealed=false) SSR render and the real rehydrated value.
function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Settings row that appears once the user has seen the 시부야 도착 intro.
 * Clicking it "re-arms" the easter egg — the animation will auto-play the
 * next time the user lands in Shibuya.
 */
export function ShibuyaResetItem() {
  const sealed = useShibuyaStore((s) => s.sealed);
  const unseal = useShibuyaStore((s) => s.unseal);
  const [justUnsealed, setJustUnsealed] = useState(false);
  const mounted = useHasMounted();

  if (!mounted || !sealed) return null;

  const handleClick = () => {
    unseal();
    setJustUnsealed(true);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        disabled={justUnsealed}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors active:bg-muted/40 disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-torii/10 p-2 text-torii">
            <Plane className="size-5" />
          </div>
          <div>
            <div className="font-heading text-[14px] font-bold tracking-tight text-sumi">
              시부야 도착 인트로 다시 보기
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {justUnsealed
                ? "준비 완료 · 다음에 시부야 도착하면 다시 펼쳐집니다"
                : "다음에 시부야에 도착하면 한 번 더 맞이합니다"}
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}
