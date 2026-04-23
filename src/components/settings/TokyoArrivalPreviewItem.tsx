"use client";

import { useState } from "react";
import { TokyoArrival } from "@/components/home/TokyoArrival";

export function TokyoArrivalPreviewItem() {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {playing && <TokyoArrival onComplete={() => setPlaying(false)} />}
      <li>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors active:bg-sumi-ink/5"
        >
          <div className="min-w-0">
            <div className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
              도쿄 도착 인트로 미리보기 (dev)
            </div>
            <div className="mt-0.5 text-[11px] text-sumi-fade">
              지금 바로 한 번 재생 · 최초 발견 상태는 그대로
            </div>
          </div>
        </button>
      </li>
    </>
  );
}
