"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const ARM_WINDOW_MS = 2000;

/**
 * Android-style "press back twice to exit" pattern, scoped to:
 *   - PWA standalone mode only (regular browser tabs would feel broken)
 *   - the home route only (deeper screens use back for normal navigation)
 *
 * How it works:
 *   1. On mount, push a sentinel history entry so a back press has something
 *      to consume.
 *   2. On the *first* back press, re-push another sentinel and show a toast.
 *      User stays on the page.
 *   3. On a *second* back press within 2s, do nothing — let the original
 *      history.back() flow through. With history empty, the OS exits the
 *      PWA / app shell.
 *
 * iOS standalone has no system back button so this is effectively
 * Android-only. Harmless on iOS — the listener never fires.
 */
export function BackToExit() {
  const pathname = usePathname();
  const armedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone));
    if (!isStandalone) return;

    // Sentinel state so the first back press has something to pop.
    history.pushState({ rrSentinel: true }, "");

    const onPopState = () => {
      if (armedRef.current) {
        // Second press in window — let it through (history.back already ran).
        return;
      }
      // First press — re-push sentinel to keep the user on the page.
      history.pushState({ rrSentinel: true }, "");
      armedRef.current = true;
      toast("한 번 더 누르면 종료돼요", { duration: ARM_WINDOW_MS });
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        armedRef.current = false;
        timerRef.current = null;
      }, ARM_WINDOW_MS);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      armedRef.current = false;
    };
  }, [pathname]);

  return null;
}
