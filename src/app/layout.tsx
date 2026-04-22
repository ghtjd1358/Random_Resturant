import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Gaegu } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
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

export const metadata: Metadata = {
  title: "랜덤레스토랑",
  description: "일본여행 중 애매할 때, 현재 위치에서 한 집 뽑아드려요.",
  applicationName: "랜덤레스토랑",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "랜덤레스토랑",
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
    <html lang="ko" className={cn("font-sans", notoSans.variable, gaegu.variable)}>
      <body className="bg-washi-grain">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col safe-pt">
          <main className="flex-1 pb-24">{children}</main>
          <BottomTabBar />
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
