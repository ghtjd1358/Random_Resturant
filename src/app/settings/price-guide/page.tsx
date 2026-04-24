import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";
import { PRICE_BUCKETS, type PriceBucket } from "@/lib/places/types";

export const metadata = { title: "가격대 기준 · 랜덤한끼" };

// Single-glyph tier label so the hanko-square stays a tidy 28×28 box.
// The ¥ symbols live separately next to the description.
const TIER_KANJI: Record<PriceBucket, string> = {
  "¥": "廉",
  "¥¥": "普",
  "¥¥¥": "上",
  "¥¥¥¥": "極",
};

export default function PriceGuidePage() {
  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="價" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="價"
          jpLabel={
            <>
              가격
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">PRICE</span>
            </>
          }
          title="가격대 기준"
          sealKanji="価格"
          sealRomaji="KAKAKU"
          subtitle="일본 외식 한 끼 기준입니다. 참고용 대략치예요."
          backHref="/settings"
          backLabel="설정"
        />

        <section className="mt-5 flex flex-col">
          {PRICE_BUCKETS.map((b) => (
            <article
              key={b.key}
              className="flex items-start gap-3 border-b border-hairline-soft py-4 last:border-b-0"
            >
              <div
                aria-hidden
                className="hanko-square shrink-0 mt-0.5"
                style={{ width: 28, height: 28, fontSize: 13 }}
              >
                {TIER_KANJI[b.key]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
                    {b.description}
                  </span>
                  <span className="font-mincho text-[13px] font-medium num-tabular text-sumi-ink whitespace-nowrap">
                    {b.label}
                  </span>
                  <span className="text-[11px] num-tabular text-shu">
                    {b.approxRange}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-sumi-mute break-keep">
                  {b.longDescription}
                </p>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-6 flex items-baseline gap-2 border-b border-hairline-soft pb-2">
          <span className="font-mincho text-[14px] font-medium text-sumi-ink">
            問
          </span>
          <span className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
            자주 묻는 질문
          </span>
          <span className="eyebrow text-[9px]">/ FAQ</span>
        </div>

        <div className="mt-3 flex flex-col gap-4">
          <FaqItem
            q="여러 개 골라도 되나요?"
            a="네. 여러 가격대를 동시에 선택할 수 있어요. 예를 들어 ¥¥ 와 ¥¥¥ 를 함께 켜면 보통 ~ 중상급 집만 후보에 남습니다."
          />
          <FaqItem
            q="「全 전체」 버튼은 뭐예요?"
            a="가격대 선택을 전부 해제해서 모든 가격대를 허용하는 기본 상태로 돌립니다."
          />
          <FaqItem
            q="왜 가격 표시 없는 집도 나와요?"
            a="Google에 가격 정보가 없는 집이 꽤 많아요. 가격 불명 집은 필터가 켜져 있어도 후보에 포함됩니다. 정확한 가격은 현지에서 확인해 주세요."
          />
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mincho text-[13px] font-medium text-sumi-ink">
        <span aria-hidden className="mr-1.5 text-shu">
          Q.
        </span>
        {q}
      </p>
      <p className="pl-4 text-[12px] leading-relaxed text-sumi-mute break-keep">
        {a}
      </p>
    </div>
  );
}
