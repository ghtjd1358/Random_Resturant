import Link from "next/link";
import { ChevronRight, Ban, Ruler, Download, Shield, Coins } from "lucide-react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PageHeader } from "@/components/common/PageHeader";
import { ShibuyaResetItem } from "@/components/settings/ShibuyaResetItem";
import { ShibuyaPreviewItem } from "@/components/settings/ShibuyaPreviewItem";

export const metadata = { title: "설정 · 랜덤한끼" };

export default function SettingsPage() {
  return (
    <div className="px-5 pt-5 pb-6">
      <PageHeader eyebrow="settings" kanji="設" title="설정" />

      <div className="mt-6">
        <InstallPrompt />
      </div>

      <ul className="mt-4 divide-y divide-border/70 rounded-xl border border-border bg-card bg-washi-soft">
        <SettingsItem
          href="/settings/skipped"
          icon={Ban}
          iconClass="text-torii bg-torii/8"
          title="다시는 안 볼 곳"
          subtitle="스킵한 가게 관리 · 복구"
        />
        <SettingsItem
          icon={Ruler}
          iconClass="text-matcha-deep bg-matcha/10"
          title="기본 검색 반경"
          subtitle="홈 화면에서 조절 가능"
        />
        <SettingsItem
          href="/settings/price-guide"
          icon={Coins}
          iconClass="text-torii bg-torii/8"
          title="가격대 기준 보기"
          subtitle="¥ · ¥¥ · ¥¥¥ · ¥¥¥¥ 는 각각 얼마?"
        />
        <SettingsItem
          href="/privacy"
          icon={Shield}
          iconClass="text-sumi-soft bg-muted"
          title="개인정보 처리방침"
          subtitle="어떤 정보를 쓰는지 한 번에 요약"
        />
        <ShibuyaResetItem />
        <ShibuyaPreviewItem />
      </ul>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        <div
          aria-hidden
          className="mx-auto mb-3 h-px w-12"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-border), transparent)",
          }}
        />
        <p className="font-heading font-bold tracking-wider">
          랜덤한끼 · v0.1.0
        </p>
        <p className="mt-1 flex items-center justify-center gap-1 text-[11px]">
          <Download className="size-3" />
          홈 화면에 추가하면 앱처럼 사용할 수 있어요
        </p>
        <p className="mt-4 text-[10px] leading-relaxed tracking-wide text-muted-foreground/80">
          식당 정보 제공 · Google Places API
          <br />
          <span>© 2026 랜덤한끼</span>
        </p>
      </footer>
    </div>
  );
}

/* --------------------------------------------------------------------- */

interface ItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  subtitle: string;
  href?: string;
}

function SettingsItem({ icon: Icon, iconClass, title, subtitle, href }: ItemProps) {
  const body = (
    <div className="flex items-center justify-between gap-3 px-4 py-4 transition-colors active:bg-muted/40">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${iconClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="font-heading text-[14px] font-bold tracking-tight text-sumi">
            {title}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {subtitle}
          </div>
        </div>
      </div>
      {href && <ChevronRight className="size-4 text-muted-foreground" />}
    </div>
  );
  return (
    <li>
      {href ? <Link href={href}>{body}</Link> : body}
    </li>
  );
}
