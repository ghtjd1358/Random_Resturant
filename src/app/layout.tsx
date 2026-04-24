import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Gaegu, Shippori_Mincho, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { BackToExit } from "@/components/common/BackToExit";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
});

const mincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mincho",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://random-restaurant-orcin.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "랜덤한끼",
  description: "뭐 먹을지 애매할 때, 지금 내 위치에서 한 집 뽑아드려요.",
  applicationName: "랜덤한끼",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "랜덤한끼",
    description: "뭐 먹을지 애매할 때, 지금 내 위치에서 한 집 뽑아드려요.",
    url: SITE_URL,
    siteName: "랜덤한끼",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "랜덤한끼",
    description: "뭐 먹을지 애매할 때, 지금 내 위치에서 한 집 뽑아드려요.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "랜덤한끼",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F5EFE6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={cn(
        "font-sans",
        notoSans.variable,
        gaegu.variable,
        mincho.variable,
        mono.variable,
      )}
    >
      <body className="bg-paper">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col safe-pt">
          <main className="flex-1 pb-24">{children}</main>
          <BottomTabBar />
        </div>
        <InstallBanner />
        <BackToExit />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
