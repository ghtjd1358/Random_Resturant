"use client";

import { Sparkles } from "lucide-react";
import { useAIReason } from "@/hooks/useAIReason";

export function AIReasonLine({ placeId }: { placeId: string }) {
  const { reason, status } = useAIReason(placeId);

  if (status === "error") return null;

  return (
    <div className="relative mt-3.5 overflow-hidden rounded-xl border border-matcha/20 bg-gradient-to-br from-matcha/8 via-matcha/5 to-matcha/10 px-3.5 py-3">
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
        <p className="min-h-[1.25rem] text-[13.5px] leading-snug text-sumi text-pretty break-keep">
          {status === "loading" ? <LoadingSkeleton /> : reason}
        </p>
      </div>

      {status === "ready" && (
        <p className="mt-1 flex items-center gap-1 pl-5 text-[10px] font-medium tracking-wide text-muted-foreground/80">
          <span className="size-1 rounded-full bg-matcha/50" aria-hidden />
          AI 생성 · 실제와 다를 수 있어요
        </p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-3.5 w-32 animate-pulse rounded bg-matcha/20" />
      <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-matcha/15" />
    </span>
  );
}
