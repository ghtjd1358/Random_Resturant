import { SkippedList } from "@/components/skipped/SkippedList";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata = { title: "스킵 관리 · 랜덤한끼" };

export default function SkippedPage() {
  return (
    <div className="px-5 pt-5 pb-6">
      <PageHeader
        eyebrow="skipped"
        kanji="除"
        title="다시는 안 볼 곳"
        subtitle="여기 있는 가게는 뽑기에 나오지 않아요 · 탭하면 복구"
        backHref="/settings"
        backLabel="설정"
      />
      <div className="mt-6">
        <SkippedList />
      </div>
    </div>
  );
}
