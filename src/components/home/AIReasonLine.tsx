"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useAIReason } from "@/hooks/useAIReason";

const ERROR_FALLBACK = "현지 평점을 바탕으로 골랐어요";

/**
 * AI one-liner box. The green container is ALWAYS rendered with fixed
 * slot height so the card never resizes — only the inner text crossfades.
 *
 * State map:
 *   loading → 2-line pulse skeleton
 *   ready   → real AI text + disclaimer
 *   error   → soft fallback string (NEVER null) so users don't see an
 *             empty 78px gap inside the card
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
    <div className="relative overflow-hidden rounded-xl border border-matcha/20 bg-gradient-to-br from-matcha/8 via-matcha/5 to-matcha/10 px-3.5 py-3">
      {/* Left tick bar */}
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-matcha/40"
      />

      <div className="flex items-start gap-2">
        <Sparkles
          className={`mt-0.5 size-3.5 shrink-0 text-matcha-deep ${
            status === "loading" ? "animate-pulse" : ""
          }`}
          strokeWidth={2.25}
        />

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
                className="flex flex-col gap-1.5 pt-0.5"
              >
                <span className="block h-3 w-full max-w-[220px] animate-pulse rounded bg-matcha/20" />
                <span className="block h-3 w-3/5 animate-pulse rounded bg-matcha/15" />
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

      {/* Disclaimer — only when actual AI text is shown (not on the
          fallback string). Opacity-gated so the row height is always
          reserved, preventing card height jitter. */}
      <p
        className={`mt-1 flex items-center gap-1 pl-5 text-[10px] font-medium tracking-wide text-muted-foreground/80 transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="size-1 rounded-full bg-matcha/50" aria-hidden />
        AI 생성 · 실제와 다를 수 있어요
      </p>
    </div>
  );
}
