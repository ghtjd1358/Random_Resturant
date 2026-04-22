"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { TokyoArrival } from "@/components/home/TokyoArrival";

/**
 * Always-visible settings row to preview the 도쿄 도착 intro on demand.
 * Unlike the reset button, this does NOT touch the sealed state — it's a
 * pure replay, so the "first discovery in Tokyo" moment stays preserved.
 */
export function TokyoArrivalPreviewItem() {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {playing && <TokyoArrival onComplete={() => setPlaying(false)} />}
      <li>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors active:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sumi/8 p-2 text-sumi">
              <Play className="size-5" />
            </div>
            <div>
              <div className="font-heading text-[14px] font-bold tracking-tight text-sumi">
                도쿄 도착 인트로 미리보기
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                지금 바로 한 번 재생 · 최초 발견 상태는 그대로
              </div>
            </div>
          </div>
        </button>
      </li>
    </>
  );
}
