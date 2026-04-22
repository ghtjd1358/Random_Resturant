"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dice5, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "뽑기", icon: Dice5 },
  { href: "/history", label: "기록", icon: ScrollText },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border/70 bg-card/92 backdrop-blur-xl safe-pb"
      aria-label="주요 탐색"
      style={{
        boxShadow: "0 -8px 24px -12px rgba(43, 43, 43, 0.1)",
      }}
    >
      {/* Hairline accent at top of bar */}
      <div
        aria-hidden
        className="absolute left-6 right-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-torii) 50%, transparent 100%)",
          opacity: 0.25,
        }}
      />

      <ul className="flex items-stretch justify-around px-2 pt-2 pb-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="relative flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "no-select relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                  active
                    ? "text-torii"
                    : "text-muted-foreground hover:text-sumi",
                )}
              >
                {/* Active lantern glow behind icon */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1.5 size-9 -translate-x-1/2 rounded-full blur-md"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(200, 16, 46, 0.22) 0%, transparent 70%)",
                    }}
                  />
                )}

                <Icon
                  className={cn(
                    "relative size-6 transition-transform",
                    active && "scale-110",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="relative font-heading text-[11px] font-bold tracking-wider">
                  {label}
                </span>

                {/* Active indicator — small noren drop under label */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-[2px]"
                  >
                    <span className="h-1 w-1 rounded-sm bg-torii" />
                    <span className="h-1.5 w-1 rounded-sm bg-torii" />
                    <span className="h-1 w-1 rounded-sm bg-torii" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
