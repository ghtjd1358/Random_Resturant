"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useAIReason } from "@/hooks/useAIReason";

/**
 * AI one-liner box. The green container is ALWAYS rendered (loading or
 * ready) at a fixed slot height so the card never resizes — only the
 * inner text crossfades between skeleton and real reason. Error state
 * falls back to null but the parent's reserved 78px slot keeps the card
 * stable either way.
 *
 * Text is clamped to 2 lines to keep the slot accurate; the API tends
 * to return 1-2 sentences anyway.
 */
export function AIReasonLine({ placeId }: { placeId: string }) {
  const { reason, status } = useAIReason(placeId);

  if (status === "error") return null;

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
            {status === "loading" ? (
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
                {reason}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Disclaimer always present — opacity gates by status so the row
          height stays reserved even during loading. */}
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
