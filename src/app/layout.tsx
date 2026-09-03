import type { Metadata } from "next";
import { Inter, Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReleaseAnnouncementModal } from "@/components/marketing/release-announcement-modal";

// Three type roles instead of one Inter-everywhere system — see the
// --font-sans/--font-display/--font-accent tokens in globals.css for how
// these get assigned. body = plain-legible UI copy, display = grotesk with
// actual character for headlines/nav/buttons, accent = italic serif
// reserved for one editorial phrase per hero/section.
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const accent = Instrument_Serif({
  variable: "--font-accent-face",
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vixerra — AI Video & Image Generation",
    template: "%s · Vixerra",
  },
  description:
    "Generate cinematic video and imagery from text, images, or audio in seconds. Vixerra is an AI creative studio for teams that ship fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${accent.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <ConfirmProvider>
                <ToastProvider>{children}</ToastProvider>
              </ConfirmProvider>
              <ReleaseAnnouncementModal />
            </TooltipProvider>
          </CurrencyProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
