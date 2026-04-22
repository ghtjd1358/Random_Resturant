import { PageHeader } from "@/components/common/PageHeader";

export const metadata = { title: "개인정보 처리방침 · 랜덤레스토랑" };

export default function PrivacyPage() {
  return (
    <div className="px-5 pt-5 pb-6">
      <PageHeader
        eyebrow="privacy"
        kanji="私"
        title="개인정보 처리방침"
        subtitle="최종 업데이트 · 2026년 4월"
        backHref="/settings"
        backLabel="설정"
      />

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-sumi/90">
        <Section title="한 줄 요약" kanji="要">
          <p className="break-keep">
            이 앱은 <strong>서버에 개인정보를 저장하지 않습니다.</strong> 위치는
            식당 검색용으로만 순간적으로 사용되고, 방문·스킵 기록은 오직 사용자의
            기기(IndexedDB)에만 저장됩니다.
          </p>
        </Section>

        <Section title="수집하는 정보" kanji="収">
          <ul className="list-disc space-y-1.5 pl-5 break-keep">
            <li>
              <strong>위치 정보 (위도·경도)</strong>: 브라우저 Geolocation API로
              받아, 근처 식당 검색(Google Places API 호출)에만 사용합니다.{" "}
              <strong>서버에 저장되지 않습니다.</strong>
            </li>
            <li>
              <strong>방문 체크 · 스킵 기록</strong>: 가게 ID와 피드백(👍/👎)
              정보. <strong>오직 사용자의 브라우저 안</strong>(IndexedDB)에
              저장되며, 서버로 전송되지 않습니다.
            </li>
            <li>
              <strong>필터 설정</strong> (카테고리·반경 등): 사용자의 localStorage에
              저장됩니다.
            </li>
          </ul>
        </Section>

        <Section title="수집하지 않는 것" kanji="否">
          <ul className="list-disc space-y-1.5 pl-5 break-keep">
            <li>이름, 이메일, 전화번호 등 식별 정보 (회원 가입 자체가 없음)</li>
            <li>광고·분석용 쿠키 및 트래킹</li>
            <li>이동 경로, 방문 히스토리의 서버 전송</li>
          </ul>
        </Section>

        <Section title="외부 서비스" kanji="外">
          <ul className="list-disc space-y-1.5 pl-5 break-keep">
            <li>
              <strong>Google Places API (New)</strong>: 식당 데이터(이름, 평점,
              리뷰 등)를 가져오기 위해 위도·경도가 Google로 전달됩니다. Google의{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-matcha-deep underline underline-offset-2"
              >
                개인정보 처리방침
              </a>
              에 따라 처리됩니다.
            </li>
            <li>
              <strong>Vercel AI Gateway (Claude Haiku 4.5)</strong>: 추천 이유 한
              줄 생성을 위해 가게 이름과 리뷰 텍스트가 전송됩니다. 개인 식별
              정보는 포함되지 않으며, Vercel AI Gateway는 Zero Data Retention
              정책을 적용합니다.
            </li>
            <li>
              <strong>Vercel 호스팅</strong>: 일반 웹 서버 액세스 로그가 보안
              목적으로 단기간 보관될 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section title="기록 삭제" kanji="消">
          <p className="break-keep">
            브라우저 설정에서 이 사이트의 데이터(Site Data)를 지우면 IndexedDB에
            저장된 모든 방문·스킵 기록이 삭제됩니다. 앱 내에서도 각 기록을 개별
            삭제할 수 있어요 (<em>기록</em> 탭 및 <em>다시는 안 볼 곳</em> 페이지).
          </p>
        </Section>

        <Section title="AI 생성 콘텐츠 면책" kanji="注">
          <p className="break-keep">
            추천 카드의 한 줄 설명은 AI가 리뷰를 바탕으로 생성합니다. 실제 가게의
            특성과 다를 수 있으며, 최종 판단은 사용자에게 있습니다.
          </p>
        </Section>

        <Section title="문의" kanji="尋">
          <p className="text-muted-foreground break-keep">
            개인 프로젝트로 운영되는 앱이며, 별도의 고객 지원은 없습니다.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  kanji,
  children,
}: {
  title: string;
  kanji: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span
          aria-hidden
          className="hanko size-5 text-[10px] font-bold leading-none"
        >
          {kanji}
        </span>
        <h2 className="font-heading text-[15px] font-bold tracking-tight text-sumi">
          {title}
        </h2>
      </div>
      <div className="pl-7 text-sm text-sumi/85">{children}</div>
    </section>
  );
}
