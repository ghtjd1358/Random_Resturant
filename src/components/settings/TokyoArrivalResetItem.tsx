"use client";

import { useState, useSyncExternalStore } from "react";
import { useTokyoArrivalStore } from "@/stores/useTokyoArrivalStore";

function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function TokyoArrivalResetItem() {
  const sealed = useTokyoArrivalStore((s) => s.sealed);
  const unseal = useTokyoArrivalStore((s) => s.unseal);
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
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors active:bg-sumi-ink/5 disabled:opacity-60"
      >
        <div className="min-w-0">
          <div className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
            도쿄 도착 인트로 다시 보기
          </div>
          <div className="mt-0.5 text-[11px] text-sumi-fade">
            {justUnsealed
              ? "준비 완료 · 다음에 도쿄 도착하면 다시 펼쳐집니다"
              : "다음에 도쿄에 도착하면 한 번 더 맞이합니다"}
          </div>
        </div>
      </button>
    </li>
  );
}
