import { SkippedList } from "@/components/skipped/SkippedList";
import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";

export const metadata = { title: "차단목록 · 랜덤한끼" };

export default function SkippedPage() {
  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="禁" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="禁"
          jpLabel={
            <>
              차단목록
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">BLOCKED</span>
            </>
          }
          title="차단목록"
          sealKanji="禁止"
          sealRomaji="KINSHI"
          subtitle="여기 있는 가게는 뽑기에 안 나옵니다 · 누르면 복구."
          backHref="/settings"
          backLabel="설정"
        />
        <div className="mt-5">
          <SkippedList />
        </div>
      </div>
    </div>
  );
}
