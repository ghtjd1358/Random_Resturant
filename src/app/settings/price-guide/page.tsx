import { PageHeader } from "@/components/common/PageHeader";
import { PRICE_BUCKETS } from "@/lib/places/types";

export const metadata = { title: "가격대 기준 · 랜덤레스토랑" };

export default function PriceGuidePage() {
  return (
    <div className="px-5 pt-5 pb-6">
      <PageHeader
        eyebrow="price guide"
        kanji="金"
        title="가격대 기준"
        subtitle="일본 외식 한 끼 기준입니다. 참고용 대략치예요."
        backHref="/settings"
        backLabel="설정으로"
      />

      <section className="mt-6 flex flex-col gap-2.5">
        {PRICE_BUCKETS.map((b) => (
          <article
            key={b.key}
            className="flex items-start gap-3 rounded-xl border border-border bg-card bg-washi-soft p-3.5"
          >
            <div
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-matcha/10 font-heading text-[13px] font-bold leading-none tracking-tight text-matcha-deep"
            >
              {b.label}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-heading text-[15px] font-bold tracking-tight text-sumi">
                  {b.description}
                </span>
                <span className="text-[11px] font-medium tabular-nums text-torii">
                  {b.approxRange}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground break-keep">
                {b.longDescription}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 px-1 font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          자주 묻는 질문
        </h2>
        <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <FaqItem
            q="여러 개 골라도 되나요?"
            a="네. 여러 가격대를 동시에 선택할 수 있어요. 예를 들어 ¥¥ 와 ¥¥¥ 를 함께 켜면 보통~중상급 집만 후보에 남습니다."
          />
          <FaqItem
            q="「전체」 버튼은 뭐예요?"
            a="가격대 선택을 전부 해제해서 모든 가격대를 허용하는 기본 상태로 돌립니다."
          />
          <FaqItem
            q="왜 가격 표시 없는 집도 나와요?"
            a="Google 에 가격 정보가 없는 집이 꽤 많아요. 가격 불명 집은 필터가 켜져 있어도 후보에 포함됩니다. 정확한 가격은 현지에서 확인해 주세요."
          />
        </div>
      </section>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-heading text-[12.5px] font-bold text-sumi">
        <span aria-hidden className="mr-1 text-torii">
          Q.
        </span>
        {q}
      </p>
      <p className="pl-4 text-[12px] leading-relaxed text-muted-foreground break-keep">
        {a}
      </p>
    </div>
  );
}
