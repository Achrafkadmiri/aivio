import Link from "next/link";
import { Logo } from "./logo";

const FOOTER_LINKS: Record<string, { href: string; label: string }[]> = {
  Product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/prompts", label: "Prompts" },
    { href: "/gallery", label: "Gallery" },
  ],
  Account: [
    { href: "/signup", label: "Sign up" },
    { href: "/login", label: "Log in" },
  ],
  Company: [{ href: "/contact", label: "Contact" }],
};

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-body-sm text-muted">
            AI video and image generation for teams that ship fast.
          </p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-label font-medium text-ink">{title}</h3>
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-muted transition-colors hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col items-center justify-between gap-4 border-t border-line py-6 sm:flex-row">
        <p className="text-caption text-muted">
          © {new Date().getFullYear()} Vixerra. All rights reserved.
        </p>
        <p className="text-caption text-muted">Built with Next.js on Cloudflare Workers AI.</p>
      </div>
    </footer>
  );
}
