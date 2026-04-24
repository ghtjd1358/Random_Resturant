import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";

export const metadata = { title: "이용허락 · 개인정보 · 랜덤한끼" };

export default function PrivacyPage() {
  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="私" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="私"
          jpLabel={
            <>
              이용허락
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">PRIVACY</span>
            </>
          }
          title="이용허락"
          sealKanji="私事"
          sealRomaji="SHIJI"
          subtitle="어떤 정보를 어떻게 쓰는지 한 번에 요약."
          backHref="/settings"
          backLabel="설정"
        />

        <SectionTitle kanji="要" labelKr="한 줄 요약" labelEn="SUMMARY" />
        <p className="text-[13px] leading-relaxed text-sumi-ink break-keep">
          이 앱은{" "}
          <strong className="font-medium text-sumi-ink">
            서버에 개인정보를 저장하지 않습니다.
          </strong>{" "}
          위치는 식당 검색용으로만 순간적으로 사용되고, 방문·스킵 기록은 오직
          사용자의 기기(IndexedDB)에만 저장됩니다.
        </p>

        <SectionTitle kanji="収" labelKr="수집하는 정보" labelEn="COLLECTED" />
        <BulletList>
          <Bullet
            head="위치 정보 (위도·경도)"
            body="브라우저 Geolocation API로 받아, 근처 식당 검색에만 사용합니다. 서버에 저장되지 않습니다."
          />
          <Bullet
            head="방문 체크 · 스킵 기록"
            body="가게 ID와 좋아요/별로 정보. 오직 사용자의 브라우저 안(IndexedDB)에 저장되며, 서버로 전송되지 않습니다."
          />
          <Bullet
            head="필터 설정"
            body="카테고리·반경 등이 사용자의 localStorage에 저장됩니다."
          />
        </BulletList>

        <SectionTitle kanji="否" labelKr="수집하지 않는 것" labelEn="NEVER" />
        <BulletList>
          <Bullet body="이름, 이메일, 전화번호 등 식별 정보 (회원 가입 자체가 없음)" />
          <Bullet body="광고 · 분석용 쿠키 및 트래킹" />
          <Bullet body="이동 경로, 방문 히스토리의 서버 전송" />
        </BulletList>

        <SectionTitle kanji="外" labelKr="외부 서비스" labelEn="EXTERNAL" />
        <BulletList>
          <Bullet
            head="Google Places API (New)"
            body={
              <>
                식당 데이터를 가져오기 위해 위도·경도가 Google로 전달됩니다.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-shu underline-offset-2 hover:underline"
                >
                  Google 개인정보 처리방침
                </a>
                에 따라 처리됩니다.
              </>
            }
          />
          <Bullet
            head="Vercel AI Gateway (Claude Haiku 4.5)"
            body="추천 이유 한 줄 생성을 위해 가게 이름과 리뷰 텍스트가 전송됩니다. 개인 식별 정보는 포함되지 않으며, Zero Data Retention 정책이 적용됩니다."
          />
          <Bullet
            head="Vercel 호스팅"
            body="일반 웹 서버 액세스 로그가 보안 목적으로 단기간 보관될 수 있습니다."
          />
        </BulletList>

        <SectionTitle kanji="消" labelKr="기록 삭제" labelEn="DELETE" />
        <p className="text-[13px] leading-relaxed text-sumi-ink break-keep">
          브라우저 설정에서 이 사이트의 데이터(Site Data)를 지우면 IndexedDB에
          저장된 모든 방문·스킵 기록이 삭제됩니다. 앱 내에서도 각 기록을 개별
          삭제할 수 있어요 (
          <em className="not-italic font-mincho text-shu">기록</em> 탭 및{" "}
          <em className="not-italic font-mincho text-shu">차단목록</em>{" "}
          페이지).
        </p>

        <SectionTitle
          kanji="注"
          labelKr="AI 생성 콘텐츠 면책"
          labelEn="AI NOTICE"
        />
        <p className="text-[13px] leading-relaxed text-sumi-ink break-keep">
          추천 카드의 한 줄 설명은 AI가 리뷰를 바탕으로 생성합니다. 실제 가게의
          특성과 다를 수 있으며, 최종 판단은 사용자에게 있습니다.
        </p>

        <SectionTitle kanji="尋" labelKr="문의" labelEn="CONTACT" />
        <p className="text-[12px] text-sumi-fade break-keep">
          개인 프로젝트로 운영되는 앱이며, 별도의 고객 지원은 없습니다.
        </p>

        <div className="hairline-soft mx-auto mt-10 mb-3 w-12" />
        <p className="text-center font-mincho text-[11px] tracking-tight text-sumi-fade">
          최종 업데이트 · 2026년 4월
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function SectionTitle({
  kanji,
  labelKr,
  labelEn,
}: {
  kanji: string;
  labelKr: string;
  labelEn: string;
}) {
  return (
    <div className="mt-7 mb-3 flex items-baseline gap-2">
      <span className="font-mincho text-[14px] font-medium text-sumi-ink">
        {kanji}
      </span>
      <span className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
        {labelKr}
      </span>
      <span className="eyebrow text-[9px]">/ {labelEn}</span>
    </div>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}

function Bullet({ head, body }: { head?: string; body: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[12.5px] leading-relaxed text-sumi-ink break-keep">
      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-shu" />
      <span>
        {head && (
          <span className="font-mincho font-medium text-sumi-ink">
            {head}:{" "}
          </span>
        )}
        <span className="text-sumi-mute">{body}</span>
      </span>
    </li>
  );
}
