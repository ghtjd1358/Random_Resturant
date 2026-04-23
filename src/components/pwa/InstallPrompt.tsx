"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { haptic } from "@/lib/haptic";
import { InstallGuide } from "./InstallGuide";

export function InstallPrompt() {
  const { platform, isInstalled, canPrompt, prompt } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  if (isInstalled) return <InstalledNotice />;

  const handleClick = async () => {
    haptic.tap();
    if (canPrompt) {
      await prompt();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="no-select relative flex w-full items-center justify-between gap-3 border border-hairline bg-paper-soft p-4 text-left transition-colors active:bg-paper-deep"
      >
        <span aria-hidden className="shu-tab" />
        <div className="flex items-center gap-3">
          <span className="hanko-square hanko-square-shu" aria-hidden>
            裝
          </span>
          <div>
            <p className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
              홈 화면에 추가
            </p>
            <p className="mt-0.5 text-[11px] text-sumi-fade">
              앱처럼 한 번에 켜지게
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-shu">설치 ▸</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <InstallGuide platform={platform} />
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            className="mt-2"
          >
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InstalledNotice() {
  return (
    <div className="relative flex items-center gap-3 border border-hairline bg-paper-soft p-4">
      <span aria-hidden className="shu-tab" />
      <span className="hanko-square hanko-square-shu" aria-hidden>
        ✓
      </span>
      <div>
        <p className="font-mincho text-[14px] font-medium tracking-tight text-sumi-ink">
          홈 화면에 설치됨
        </p>
        <p className="mt-0.5 text-[11px] text-sumi-fade">앱처럼 사용 중이에요</p>
      </div>
    </div>
  );
}
