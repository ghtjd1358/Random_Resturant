import { VisitedList } from "@/components/history/VisitedList";
import { PageHeader } from "@/components/common/PageHeader";

export const metadata = { title: "방문 기록 · 여기맞아?" };

export default function HistoryPage() {
  return (
    <div className="px-5 pt-5 pb-6">
      <PageHeader
        eyebrow="history"
        kanji="録"
        title="방문 기록"
        subtitle="이번 여행에서 다녀온 한 집 한 집"
      />
      <div className="mt-6">
        <VisitedList />
      </div>
    </div>
  );
}
