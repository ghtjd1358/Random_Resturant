"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InstallGuide } from "./InstallGuide";

const DISMISS_KEY = "rr-install-banner-dismissed-at";
const DISMISS_DAYS = 7;
const APPEAR_DELAY_MS = 1500;
const FADE_OUT_MS = 220;

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  const ageMs = Date.now() - ts;
  return ageMs >= 0 && ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function recordDismiss() {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

/**
 * Bottom-anchored slide-up banner that nudges the user to install the PWA on
 * first visit (and again every 7 days if they dismiss without installing).
 *
 * Sits *above* BottomTabBar via `bottom: calc(env(safe-area-inset-bottom) + 4.5rem)`.
 * On platforms where the browser exposes `beforeinstallprompt` (Android Chrome
 * etc.) the "설치" tap calls native prompt(); on iOS Safari it opens the
 * InstallGuide modal instead since iOS provides no programmatic install.
 */
export function InstallBanner() {
  const { platform, isInstalled, canPrompt, prompt } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Decide visibility once we know install state. Small delay so the banner
  // doesn't cover the home screen's first paint.
  useEffect(() => {
    if (isInstalled) return;
    if (isDismissedRecently()) return;
    // iOS in-app browsers (Instagram, KakaoTalk webview etc.) literally can't
    // install — skip the banner there to avoid dead-end UX.
    if (platform === "ios-other" || platform === "android-other") return;

    const t = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isInstalled, platform]);

  if (!visible) return null;

  const handleInstall = async () => {
    haptic.tap();
    if (canPrompt) {
      const result = await prompt();
      if (result === "accepted") {
        // The appinstalled event will flip isInstalled and unmount the banner;
        // collapse immediately for snappy feedback.
        setClosing(true);
        window.setTimeout(() => setVisible(false), FADE_OUT_MS);
      }
      // dismissed → leave the banner up; user can try again
      return;
    }
    // No native prompt (iOS Safari, desktop Safari) → show step-by-step guide.
    setGuideOpen(true);
  };

  const handleDismiss = () => {
    haptic.tap();
    recordDismiss();
    setClosing(true);
    window.setTimeout(() => setVisible(false), FADE_OUT_MS);
  };

  return (
    <>
      <div
        role="region"
        aria-label="홈 화면에 추가"
        className={cn(
          "fixed left-1/2 z-30 w-full max-w-[460px] -translate-x-1/2 px-4",
          "transition-all duration-200 ease-out",
          closing
            ? "translate-y-6 opacity-0"
            : "translate-y-0 opacity-100",
        )}
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)",
        }}
      >
        <div
          className="relative border border-hairline bg-paper-soft px-4 py-3"
          style={{
            boxShadow:
              "0 -4px 24px -10px rgba(28, 24, 21, 0.22), 0 1px 0 rgba(28, 24, 21, 0.04)",
          }}
        >
          <span aria-hidden className="shu-tab" />
          <div className="flex items-center gap-3">
            <span
              className="hanko-square hanko-square-shu shrink-0"
              aria-hidden
            >
              裝
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mincho text-[13px] font-medium tracking-tight text-sumi-ink">
                홈 화면에 추가
              </p>
              <p className="mt-0.5 truncate text-[11px] text-sumi-fade">
                앱처럼 한 번에 켜져요
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="font-mincho shrink-0 text-[12px] font-medium text-shu transition-opacity hover:opacity-70"
            >
              설치 ▸
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="닫기"
              className="shrink-0 rounded-sm p-1 text-sumi-fade transition-colors hover:text-sumi-ink"
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-sm">
          <InstallGuide platform={platform} />
        </DialogContent>
      </Dialog>
    </>
  );
}
