import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PageHeader } from "@/components/common/PageHeader";
import { KanjiWatermark } from "@/components/common/KanjiWatermark";
import { TokyoArrivalResetItem } from "@/components/settings/TokyoArrivalResetItem";
import { TokyoArrivalPreviewItem } from "@/components/settings/TokyoArrivalPreviewItem";

export const metadata = { title: "설정 · 랜덤한끼" };

export default function SettingsPage() {
  return (
    <div className="relative px-5 pt-5 pb-6">
      <KanjiWatermark glyph="設" />
      <div className="relative z-10">
        <PageHeader
          eyebrow="random · hankki"
          kanji="設"
          jpLabel={
            <>
              설정
              <span className="mx-1.5 text-sumi-fade/60">/</span>
              <span className="text-sumi-fade">SETTINGS</span>
            </>
          }
          title="설정"
          sealKanji="設定"
          sealRomaji="SETTEI"
          subtitle="앱이 나를 더 잘 알게 해요."
        />

        <div className="mt-5">
          <InstallPrompt />
        </div>

        <SectionLabel kanji="録">내 기록</SectionLabel>
        <SettingsGroup>
          <SettingsItem
            href="/settings/skipped"
            title="다시는 안 볼 곳"
            subtitle="스킵한 가게 관리 · 복구"
          />
          <SettingsItem
            title="기본 거리"
            subtitle="800m · 홈에서 바로 바꿀 수 있어요"
          />
          <SettingsItem
            href="/settings/price-guide"
            title="가격대 기준"
            subtitle="¥ · ¥¥ · ¥¥¥ · ¥¥¥¥ 이 뭔지"
          />
        </SettingsGroup>

        <SectionLabel kanji="好">취향 학습</SectionLabel>
        <SettingsGroup>
          <SettingsItem
            title="지금까지 학습된 취향"
            subtitle="또 갈래요 0 · 별로 0"
          />
          <SettingsItem
            title="처음부터 다시 배우게 하기"
            subtitle="학습 기록을 모두 지워요"
            accent
          />
        </SettingsGroup>

        <SectionLabel kanji="他">기타</SectionLabel>
        <SettingsGroup>
          <SettingsItem
            href="/privacy"
            title="개인정보 처리방침"
            subtitle="어떤 정보를 어떻게 쓰는지"
          />
          <TokyoArrivalResetItem />
          {process.env.NODE_ENV !== "production" && <TokyoArrivalPreviewItem />}
        </SettingsGroup>

        <footer className="mt-10 text-center">
          <div className="hairline-soft mx-auto mb-3 w-12" />
          <p className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
            랜덤한끼 · v0.1.0
          </p>
          <p className="mt-3 text-[10px] leading-relaxed tracking-wide text-sumi-fade">
            식당 정보 제공 · Google Places API
            <br />
            <span>© 2026 랜덤한끼</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */

function SectionLabel({
  kanji,
  children,
}: {
  kanji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-7 mb-2 flex items-baseline gap-2">
      <span className="font-mincho text-[14px] font-medium text-sumi-ink">
        {kanji}
      </span>
      <span className="font-mincho text-[12px] font-medium tracking-tight text-sumi-mute">
        {children}
      </span>
      <span className="ml-2 hairline-soft flex-1" />
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-hairline-soft border-y border-hairline-soft">
      {children}
    </ul>
  );
}

interface ItemProps {
  title: string;
  subtitle: string;
  href?: string;
  accent?: boolean;
}

function SettingsItem({ title, subtitle, href, accent }: ItemProps) {
  const body = (
    <div className="flex items-center justify-between gap-3 py-3.5 transition-colors active:bg-sumi-ink/5">
      <div className="min-w-0">
        <div
          className={`font-mincho text-[14px] font-medium tracking-tight ${accent ? "text-shu" : "text-sumi-ink"}`}
        >
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-sumi-fade">{subtitle}</div>
      </div>
      {href && <ChevronRight className="size-4 shrink-0 text-sumi-fade" />}
    </div>
  );
  return <li>{href ? <Link href={href}>{body}</Link> : body}</li>;
}
