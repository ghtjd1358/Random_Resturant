"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { Mascot } from "@/components/common/Mascot";
import { ActionBar } from "./ActionBar";
import { PickCardBody } from "./PickCardBody";

export function PickCard() {
  const pick = useSessionStore((s) => s.currentPick);
  const status = useSessionStore((s) => s.status);
  const pickedCount = useSessionStore((s) => s.lastPickedIds.length);
  const issueNo = String(42 + pickedCount).padStart(3, "0");

  // Card with full content runs ~440-480px tall (header + body + AI + actions).
  // Old min-h was 240 — so when pick cleared, the page collapsed ~200px in
  // a single frame and felt like jank. Holding the slot at the full height
  // means the placeholder sits inside a stable container; nothing below
  // (page content, bottom tab bar) shifts when pick changes.
  return (
    <div className="min-h-[460px] w-full">
      <AnimatePresence mode="wait">
        {pick ? (
          <motion.article
            key={pick.id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden border border-hairline bg-paper-soft"
          >
            {/* 2px 朱 corner tab — printed-paper accent */}
            <span aria-hidden className="shu-tab" />

            {/* Full-body mascot watermark — anchored bottom-right of the
                card. Bigger + slightly more opaque so the giraffe is
                visible as a quiet illustration behind the editorial text. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 -bottom-2 size-56 select-none opacity-[0.13]"
            >
              <Image
                src="/mascot-giraffe.png"
                alt=""
                fill
                sizes="224px"
                className="object-contain object-bottom"
              />
            </div>

            <div className="relative z-10">
              {/* Eyebrow row: N° issue · 오늘의 한 집 + 推 hanko */}
              <div className="flex items-center justify-between border-b border-hairline-soft px-5 pt-4 pb-3">
                <span className="eyebrow num-tabular">
                  N° {issueNo} · <span className="text-sumi-mute">오늘의 한 집</span>
                </span>
                <span className="hanko-square hanko-square-shu" aria-hidden>
                  推
                </span>
              </div>

              <PickCardBody pick={pick} />

              <ActionBar place={pick} />
            </div>
          </motion.article>
        ) : (
          <Placeholder rolling={status === "rolling"} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function Placeholder({ rolling }: { rolling: boolean }) {
  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative flex flex-col items-center border border-dashed border-hairline px-6 py-8 text-center"
    >
      {/* State-driven mascot — brush-desk = calculating, book-read = waiting.
          AnimatePresence crossfades when phase flips so the variant doesn't
          hard-swap. The infinite breath/write loops stay CSS — they're
          pure ambient ticks, not orchestrated. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={rolling ? "rolling" : "idle"}
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={
            rolling
              ? "animate-[mascot-write_2.4s_ease-in-out_infinite]"
              : "animate-[mascot-idle-breathe_3.6s_ease-in-out_infinite]"
          }
        >
          <Mascot variant={rolling ? "brush-desk" : "book-read"} size="md" />
        </motion.div>
      </AnimatePresence>

      <p className="mt-3 leading-relaxed break-keep">
        {rolling ? (
          <>
            <span className="font-mincho text-[15px] font-medium text-sumi-ink">
              고르는 중 …
            </span>
            <br />
            <span className="mt-1 block text-[11px] text-sumi-fade">
              평점 · 거리 · 취향을 따져보는 중이에요
            </span>
          </>
        ) : (
          <>
            <span className="font-mincho text-[15px] font-medium text-sumi-mute">
              위의 選 버튼을 눌러주세요.
            </span>
            <br />
            <span className="mt-1 block text-[11px] text-sumi-fade">
              현지 평점 높은 한 집이 나옵니다.
            </span>
          </>
        )}
      </p>
    </motion.div>
  );
}
