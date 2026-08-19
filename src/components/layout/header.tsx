"use client";

import Link from "next/link";
import { useMe } from "@/hooks/use-me";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/prompts", label: "Prompts" },
  { href: "/gallery", label: "Gallery" },
];

// White-pill / ghost-pill treatment mirrors leonardo.ai's own transparent,
// borderless navbar (Log in = solid white pill, other links = ghost pill).
const primaryPill =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-label font-semibold text-black transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]";
const ghostPill =
  "rounded-full px-4 py-2 text-label font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white";

export function Header() {
  const { data: user } = useMe();
  const isAuthed = Boolean(user);

  return (
    <header className="sticky top-0 z-20 bg-transparent">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={ghostPill}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthed ? (
            <Link href="/dashboard" className={primaryPill}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={ghostPill}>
                Log in
              </Link>
              <Link href="/signup" className={primaryPill}>
                Get started
              </Link>
            </>
          )}
        </div>

        <MobileNav isAuthed={isAuthed} />
      </div>
    </header>
  );
}
