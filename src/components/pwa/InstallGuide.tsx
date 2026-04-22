"use client";

import {
  Download,
  Globe,
  Menu,
  MoreHorizontal,
  MoreVertical,
  PlusSquare,
  Share,
} from "lucide-react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Platform } from "@/hooks/useInstallPrompt";

/** Platform-aware instructions for adding the PWA to the home screen. */
export function InstallGuide({ platform }: { platform: Platform }) {
  if (platform === "ios-safari") return <IosSafariGuide />;
  if (platform === "ios-other") return <IosOtherGuide />;
  if (platform === "android-chrome") return <AndroidChromeGuide />;
  if (platform === "android-samsung") return <AndroidSamsungGuide />;
  if (platform === "android-edge") return <AndroidEdgeGuide />;
  if (platform === "android-firefox") return <AndroidFirefoxGuide />;
  if (platform === "android-other") return <AndroidOtherGuide />;
  return <DesktopGuide />;
}

function IosSafariGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">홈 화면에 추가하기</DialogTitle>
        <DialogDescription>
          Safari 하단 메뉴에서 두 단계로 설치할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          하단의
          <Chip icon={<Share className="size-3" />}>공유</Chip>
          버튼을 눌러주세요.
        </Step>
        <Step n={2}>
          <Chip icon={<PlusSquare className="size-3" />}>홈 화면에 추가</Chip>
          를 선택해 주세요.
        </Step>
      </ol>
    </>
  );
}

function IosOtherGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Safari로 열어주세요</DialogTitle>
        <DialogDescription>
          iPhone/iPad는 <b>Safari 브라우저에서만</b> 앱처럼 설치할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          주소창을 탭해서 <b>Safari에서 열기</b>를 선택해 주세요.
          <br />
          (또는 현재 URL을 복사해서 Safari에 붙여넣기)
        </Step>
        <Step n={2}>
          Safari에서 열린 뒤, 하단의
          <Chip icon={<Share className="size-3" />}>공유</Chip> →
          <Chip icon={<PlusSquare className="size-3" />}>홈 화면에 추가</Chip>
          순서로 설치하세요.
        </Step>
      </ol>
    </>
  );
}

function AndroidChromeGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Chrome에서 설치하기</DialogTitle>
        <DialogDescription>
          Chrome 우측 상단의 메뉴에서 설치할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          우측 상단의
          <Chip icon={<MoreVertical className="size-3" />}>점 세 개 ⋮</Chip>
          버튼을 눌러주세요.
        </Step>
        <Step n={2}>
          <Chip icon={<Download className="size-3" />}>앱 설치</Chip>
          또는
          <Chip icon={<PlusSquare className="size-3" />}>홈 화면에 추가</Chip>
          를 선택해 주세요.
        </Step>
      </ol>
    </>
  );
}

function AndroidSamsungGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">삼성 인터넷에서 설치하기</DialogTitle>
        <DialogDescription>
          하단 메뉴에서 바로 홈 화면에 추가할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          화면 <b>하단 가운데</b>의
          <Chip icon={<Menu className="size-3" />}>가로줄 세 개 ≡</Chip>
          버튼을 눌러주세요.
        </Step>
        <Step n={2}>
          <Chip icon={<PlusSquare className="size-3" />}>현재 페이지 추가</Chip>
          → <Chip icon={<PlusSquare className="size-3" />}>홈 화면</Chip>
          을 선택해 주세요.
        </Step>
      </ol>
    </>
  );
}

function AndroidEdgeGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Edge에서 설치하기</DialogTitle>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          화면 <b>하단 가운데</b>의
          <Chip icon={<MoreHorizontal className="size-3" />}>점 세 개 ···</Chip>
          버튼을 눌러주세요.
        </Step>
        <Step n={2}>
          <Chip icon={<PlusSquare className="size-3" />}>휴대폰에 추가</Chip>
          또는 <Chip icon={<Download className="size-3" />}>앱 설치</Chip>
          를 선택해 주세요.
        </Step>
      </ol>
    </>
  );
}

function AndroidFirefoxGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Firefox에서 설치하기</DialogTitle>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          주소창 오른쪽의
          <Chip icon={<MoreVertical className="size-3" />}>점 세 개 ⋮</Chip>
          버튼을 눌러주세요.
        </Step>
        <Step n={2}>
          <Chip icon={<PlusSquare className="size-3" />}>홈 화면에 추가</Chip>
          를 선택해 주세요.
        </Step>
      </ol>
    </>
  );
}

function AndroidOtherGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">Chrome에서 열어주세요</DialogTitle>
        <DialogDescription>
          현재 인앱 브라우저라 설치가 어려워요.
        </DialogDescription>
      </DialogHeader>
      <ol className="mt-2 flex flex-col gap-4 text-sm">
        <Step n={1}>
          브라우저 메뉴에서 <b>외부 브라우저로 열기</b>를 선택해 주세요.
        </Step>
        <Step n={2}>
          Chrome에서 열리면 우측 상단
          <Chip icon={<MoreVertical className="size-3" />}>점 세 개 ⋮</Chip>
          → <Chip icon={<Download className="size-3" />}>앱 설치</Chip>
          를 눌러주세요.
        </Step>
      </ol>
    </>
  );
}

function DesktopGuide() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">모바일에서 설치하세요</DialogTitle>
        <DialogDescription>
          이 주소를 폰에서 열면 앱으로 설치할 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-2 flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
        <Globe className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p>
            <b>Android</b>는 Chrome, <b>iPhone</b>은 Safari 브라우저를 사용하세요.
          </p>
          <p className="mt-1 text-xs">
            데스크톱 Chrome/Edge에서는 주소창 우측의 <b>설치 아이콘 📥</b> 으로도
            설치할 수 있어요.
          </p>
        </div>
      </div>
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-matcha/15 font-heading text-sm font-bold text-matcha">
        {n}
      </span>
      <div className="flex-1 pt-0.5">{children}</div>
    </li>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="mx-1 inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
      {icon} {children}
    </span>
  );
}
