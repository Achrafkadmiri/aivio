"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/prompts", label: "Prompts" },
  { href: "/gallery", label: "Gallery" },
];

// Matches the transparent white-pill navbar in header.tsx.
const primaryPill =
  "inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-label font-semibold text-black";
const ghostPill =
  "rounded-full border border-line px-6 py-3 text-center text-label font-medium text-white/80";

export function MobileNav({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-surface p-6">
          <div className="flex items-center justify-between">
            <span className="text-subheading font-semibold text-ink">Menu</span>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close menu">
              <X className="size-5" />
            </Button>
          </div>
          <nav className="mt-10 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-xl px-4 py-4 text-body text-ink-soft transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pt-6">
            {isAuthed ? (
              <Link href="/dashboard" onClick={close} className={primaryPill}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={close} className={ghostPill}>
                  Log in
                </Link>
                <Link href="/signup" onClick={close} className={primaryPill}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
