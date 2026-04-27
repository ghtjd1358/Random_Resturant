"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type Platform =
  | "standalone"
  | "ios-safari"
  | "ios-other" // iOS Chrome/Firefox/in-app browser — can't install PWA, must switch to Safari
  | "android-chrome" // top-right ⋮ menu
  | "android-samsung" // bottom ≡ hamburger menu
  | "android-edge" // bottom ··· menu
  | "android-firefox" // bottom ⋮
  | "android-other"
  | "desktop"
  | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (typeof navigator !== "undefined" &&
      "standalone" in navigator &&
      Boolean((navigator as unknown as { standalone?: boolean }).standalone));
  if (standalone) return "standalone";

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    // iOS Safari: WebKit UA with no CriOS/FxiOS/in-app marker
    const isIOSSafari =
      !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|Instagram|FBAN|FBAV|KAKAOTALK/.test(ua);
    return isIOSSafari ? "ios-safari" : "ios-other";
  }
  if (isAndroid) {
    const isInApp = /Instagram|FBAN|FBAV|KAKAOTALK|Line|NAVER|DaumApps/.test(ua);
    if (isInApp) return "android-other";
    if (/SamsungBrowser/.test(ua)) return "android-samsung";
    if (/EdgA|EdgiOS|Edg\//.test(ua)) return "android-edge";
    if (/Firefox|FxiOS/.test(ua)) return "android-firefox";
    // Chrome, Brave, Opera, Vivaldi, etc. all match this.
    if (/Chrome/.test(ua)) return "android-chrome";
    return "android-other";
  }
  return "desktop";
}

// Stable no-op subscribe: platform never changes after first client render,
// so we don't need to re-snapshot. useSyncExternalStore handles SSR vs
// client snapshot natively (no hydration mismatch) and avoids the
// set-state-in-effect lint rule triggered by useEffect+setState.
const subscribePlatform = () => () => {};
const getPlatformSnapshot = () => detectPlatform();
const getPlatformServerSnapshot = (): Platform => "unknown";

/** Captures beforeinstallprompt and exposes a prompt() trigger. */
export function useInstallPrompt() {
  const platform = useSyncExternalStore(
    subscribePlatform,
    getPlatformSnapshot,
    getPlatformServerSnapshot,
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isInstalled = platform === "standalone";
  const canPrompt = deferred !== null;

  const prompt = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  };

  return { platform, isInstalled, canPrompt, prompt };
}
