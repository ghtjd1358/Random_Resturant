import { Mascot } from "@/components/common/Mascot";

export const metadata = { title: "오프라인 · 랜덤한끼" };

/**
 * Lantern giraffe replaces the old WifiOff icon — same "guide in the dark"
 * metaphor, but on-brand. Editorial empty state with a single hairline
 * divider instead of the old utility chrome (rounded muted box).
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
      <Mascot variant="lantern" size="lg" decorative={false} />

      <h1 className="font-mincho mt-5 text-[1.6rem] font-medium tracking-tight text-sumi-ink">
        오프라인이에요
      </h1>

      <div
        aria-hidden
        className="mt-3 h-px w-10"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-hairline), transparent)",
        }}
      />

      <p className="font-mincho mt-4 text-[13px] leading-relaxed text-sumi-mute text-balance break-keep">
        새로운 추천은 네트워크가 필요해요.
        <br />
        방문 기록과 스킵 목록은 인터넷 없이도 확인할 수 있어요.
      </p>
    </div>
  );
}
