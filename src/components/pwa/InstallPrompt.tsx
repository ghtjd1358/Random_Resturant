"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
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
        className="no-select flex w-full items-center gap-3 rounded-xl border border-matcha/30 bg-matcha/10 p-4 text-left transition-colors active:bg-matcha/15"
      >
        <div className="rounded-lg bg-matcha/20 p-2">
          <Download className="size-5 text-matcha" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">홈 화면에 추가</p>
          <p className="text-xs text-muted-foreground">
            앱처럼 빠르게 열 수 있어요
          </p>
        </div>
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
    <div className="flex items-center gap-3 rounded-xl border border-matcha/30 bg-matcha/10 p-4">
      <div className="rounded-lg bg-matcha/20 p-2">
        <Check className="size-5 text-matcha" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">홈 화면에 설치됨</p>
        <p className="text-xs text-muted-foreground">앱처럼 사용 중이에요</p>
      </div>
    </div>
  );
}
