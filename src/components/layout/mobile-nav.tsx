"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/prompts", label: "Prompts" },
  { href: "/gallery", label: "Gallery" },
];

export function MobileNav({ isAuthed }: { isAuthed: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
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
          <nav className="mt-10 flex flex-col divide-y divide-line border-y border-line">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "flex items-center justify-between py-4 text-body transition-colors",
                    active ? "text-ink" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {link.label}
                  {active && <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pt-6">
            {isAuthed ? (
              <Link href="/dashboard" onClick={close} className={buttonVariants({ className: "w-full" })}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={close}
                  className={buttonVariants({ variant: "secondary", className: "w-full" })}
                >
                  Log in
                </Link>
                <Link href="/signup" onClick={close} className={buttonVariants({ className: "w-full" })}>
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
