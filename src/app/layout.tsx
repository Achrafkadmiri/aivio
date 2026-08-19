import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReleaseAnnouncementModal } from "@/components/marketing/release-announcement-modal";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aivio — AI Video & Image Generation",
    template: "%s · Aivio",
  },
  description:
    "Generate cinematic video and imagery from text, images, or audio in seconds. Aivio is an AI creative studio for teams that ship fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <ToastProvider>{children}</ToastProvider>
              <ReleaseAnnouncementModal />
            </TooltipProvider>
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
