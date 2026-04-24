"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "뽑기", kanji: "選" },
  { href: "/lottery", label: "제비", kanji: "籤" },
  { href: "/history", label: "기록", kanji: "録" },
  { href: "/settings", label: "설정", kanji: "設" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-hairline bg-paper/92 backdrop-blur-xl safe-pb"
      aria-label="주요 탐색"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2.5 pb-2">
        {TABS.map(({ href, label, kanji }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="relative flex-1">
              <Link
                href={href}
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
