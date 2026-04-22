import { WifiOff } from "lucide-react";

export const metadata = { title: "오프라인 · 랜덤한끼" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <div className="relative mb-5 flex size-20 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-muted/60"
        />
        <span
          aria-hidden
          className="absolute inset-2 rounded-full border border-dashed border-border"
        />
        <WifiOff className="relative size-8 text-muted-foreground" strokeWidth={1.75} />
      </div>

      <h1 className="font-heading text-[1.75rem] font-bold tracking-tight text-sumi">
        오프라인이에요
      </h1>

      <div
        aria-hidden
        className="mt-3 h-px w-10"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-border), transparent)",
        }}
      />

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-balance break-keep">
        새로운 추천은 네트워크가 필요해요.
        <br />
        방문 기록과 스킵 목록은 인터넷 없이도 확인할 수 있어요.
      </p>
    </div>
  );
}
