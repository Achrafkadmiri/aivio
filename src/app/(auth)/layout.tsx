import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { GradientGlow } from "@/components/marketing/gradient-glow";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-4 py-12">
      <RedirectIfAuthenticated />
      <GradientGlow className="opacity-70" />
      <Logo className="relative mb-8" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
