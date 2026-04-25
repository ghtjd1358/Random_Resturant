"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "뽑기", kanji: "選" },
  // 제비 탭 일시 숨김 — kuji/yabawi 애니가 currentlly 톤 부족 ("겁나
  // 촌스럽다" 피드백). 디자이너 에셋 또는 premium Lottie 받기 전까진
  // 사용자 진입 막음. 페이지 자체(/lottery)와 코드는 유지 — 작업
  // 재개할 때 줄만 풀면 바로 복귀.
  // { href: "/lottery", label: "제비", kanji: "籤" },
  { href: "/history", label: "기록", kanji: "録" },
  { href: "/settings", label: "설정", kanji: "設" },
] as const;

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomTabBar() {
  const pathname = usePathname();
  // Optimistic active tab. Next.js's usePathname doesn't update until the
  // new route commits, so clicking 제비 → 뽑기 left the OLD tab highlighted
  // for a noticeable beat while the heavy lottery page tore down. We track
  // the user's *intent* on click and clear it once pathname catches up.
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    if (intent && isActive(intent, pathname)) setIntent(null);
  }, [pathname, intent]);

  const effective = intent ?? pathname;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-hairline bg-paper/92 backdrop-blur-xl safe-pb"
      aria-label="주요 탐색"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2.5 pb-2">
        {TABS.map(({ href, label, kanji }) => {
          const active = isActive(href, effective);
          return (
            <li key={href} className="relative flex-1">
              <Link
                href={href}
                onClick={() => {
                  // Same-tab tap shouldn't flicker — only set intent if
                  // navigating somewhere else.
                  if (!isActive(href, pathname)) setIntent(href);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "no-select relative flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                  active ? "text-sumi-ink" : "text-sumi-fade hover:text-sumi-ink",
                )}
              >
                <span
                  className={cn(
                    "font-mincho flex size-9 items-center justify-center text-[20px] font-medium leading-none transition-colors",
                    active && "bg-sumi-ink text-paper",
                  )}
                >
                  {kanji}
                </span>
                <span
                  className={cn(
                    "font-mincho text-[10px] tracking-tight",
                    active ? "text-sumi-ink" : "text-sumi-fade",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
