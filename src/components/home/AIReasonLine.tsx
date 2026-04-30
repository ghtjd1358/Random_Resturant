"use client";

import { AnimatePresence, motion } from "motion/react";
import { useAIReason } from "@/hooks/useAIReason";

const ERROR_FALLBACK = "현지 평점을 바탕으로 골랐어요";

/**
 * One-liner reason block. Editorial blockquote tone — no AI sparkles, no
 * gradient. Slot height is fixed so the card never resizes; only inner text
 * crossfades between skeleton and copy.
 */
export function AIReasonLine({ placeId }: { placeId: string }) {
  const { reason, status } = useAIReason(placeId);

  const displayText =
    status === "ready" && reason
      ? reason
      : status === "error"
        ? ERROR_FALLBACK
        : null;

  return (
    <div className="relative rounded-md border border-hairline bg-washi-soft px-3.5 py-3">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="font-mincho mt-[-2px] shrink-0 text-[18px] leading-none text-sumi-fade"
        >
          「
        </span>

        {/* Text area is fixed height (2 lines @ leading-snug) so the
            skeleton ↔ real text swap doesn't resize the card. */}
        <div className="min-h-[2.5rem] flex-1">
          <AnimatePresence mode="wait">
            {displayText === null ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5 pt-1"
              >
                <span className="block h-2.5 w-full max-w-[220px] animate-pulse rounded-sm bg-sumi-fade/20" />
                <span className="block h-2.5 w-3/5 animate-pulse rounded-sm bg-sumi-fade/15" />
              </motion.div>
            ) : (
              <motion.p
                key="reason"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="line-clamp-2 text-[13.5px] leading-snug text-sumi text-pretty break-keep"
              >
                {displayText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Disclaimer — kept for transparency but tone-neutral. Opacity-gated
          so the row height is always reserved, preventing card jitter. */}
      <p
        className={`mt-1 pl-5 text-[10px] tracking-wide text-sumi-fade transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      >
        한 줄 평 · 실제와 다를 수 있어요
      </p>
    </div>
  );
}
