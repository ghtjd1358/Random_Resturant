import { VisitedList } from "@/components/history/VisitedList";
import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";

export const metadata = { title: "방문 기록 · 랜덤한끼" };

export default function HistoryPage() {
  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="録" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="録"
          jpLabel={
            <>
              다녀온 곳
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">HISTORY</span>
            </>
          }
          title="다녀온 곳"
          sealKanji="訪問"
          sealRomaji="HOUMON"
          subtitle="이번 여행에서 만난 가게들."
        />
        <div className="mt-5">
          <VisitedList />
        </div>
      </div>
    </div>
  );
}
