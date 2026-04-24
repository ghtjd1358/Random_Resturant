"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useAIReason } from "@/hooks/useAIReason";

/**
 * AI one-liner box. Renders ONLY when the reason is ready — loading and
 * error states return null so the card doesn't resize as the API
 * resolves. The parent (PickCardBody) reserves a fixed slot so the box
 * fades into space that was already there.
 *
 * Text is clamped to 2 lines to keep the reserved slot accurate; the API
 * tends to return 1-2 sentences anyway.
 */
export function AIReasonLine({ placeId }: { placeId: string }) {
  const { reason, status } = useAIReason(placeId);

  return (
    <AnimatePresence>
      {status === "ready" && reason && (
        <motion.div
          key="ai-ready"
          className="relative overflow-hidden rounded-xl border border-matcha/20 bg-gradient-to-br from-matcha/8 via-matcha/5 to-matcha/10 px-3.5 py-3"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Left tick bar */}
          <span
            aria-hidden
            className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-matcha/40"
          />

          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 size-3.5 shrink-0 text-matcha-deep"
              strokeWidth={2.25}
            />
            <p className="line-clamp-2 text-[13.5px] leading-snug text-sumi text-pretty break-keep">
              {reason}
            </p>
          </div>

          <p className="mt-1 flex items-center gap-1 pl-5 text-[10px] font-medium tracking-wide text-muted-foreground/80">
            <span className="size-1 rounded-full bg-matcha/50" aria-hidden />
            AI 생성 · 실제와 다를 수 있어요
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
