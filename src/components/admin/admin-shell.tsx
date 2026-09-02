"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Gauge,
  Users,
  Coins,
  Wand2,
  Images,
  LifeBuoy,
  Activity,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useAdminMe, useAdminLogout } from "@/hooks/use-admin";

/**
 * Chrome for every page under /admin except the login screen.
 *
 * Deliberately not AppShell: this is a different product for a different
 * person, and sharing the customer shell would put the credits pill, the
 * "Generate" nav and the user's own avatar around screens where an operator
 * is acting on *other people's* accounts — an easy way to lose track of
 * whose data you are looking at. The visible red "Staff" marker exists for
 * the same reason.
 */

const NAV = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/credits", label: "Credits", icon: Coins },
  { href: "/admin/generations", label: "Generations", icon: Activity },
  { href: "/admin/presets", label: "Presets", icon: Wand2 },
  { href: "/admin/content", label: "Content", icon: Images },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: admin, isLoading, isError } = useAdminMe();
  const logout = useAdminLogout();

  // Client-side gate, matching how AppShell protects the app: the session
  // lives in a cross-site cookie only the browser can present to the Edge
  // Function, so middleware can't see it. The server-side guard is
  // requireAdmin() on every /api/admin route — this redirect is only so an
  // unauthenticated operator lands somewhere sensible instead of on a page
  // of failed requests.
  useEffect(() => {
    if (isError) router.replace("/admin/login");
  }, [isError, router]);

  if (isLoading || isError || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-app">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface-sidebar lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
          <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
          <span className="font-display text-label font-bold tracking-wide text-ink uppercase">
            Admin
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-display flex items-center gap-3 rounded-xl px-3 py-2 text-label font-medium transition-colors",
                  active
                    ? "bg-brand/10 text-ink"
                    : "text-muted hover:bg-white/5 hover:text-ink-soft",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-brand/15" : "bg-white/5",
                  )}
                >
                  <item.icon
                    className={cn("size-4", active ? "text-brand" : "text-muted")}
                    aria-hidden="true"
                  />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line p-4">
          <div className="px-1">
            <p className="truncate text-label text-ink-soft">{admin.name}</p>
            <p className="truncate text-caption text-muted">{admin.email}</p>
            {/* Shown from day one even though nothing enforces it yet, so an
                operator always knows which hat they are wearing — and so the
                gap is visible rather than forgotten once roles get meanings. */}
            <span className="mt-1.5 inline-flex rounded-full border border-line bg-white/5 px-2 py-0.5 text-caption text-muted capitalize">
              {admin.role}
            </span>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-label text-muted transition-colors hover:bg-white/5 hover:text-ink-soft"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Standing reminder that actions here are privileged and act on
            other people's accounts. Uses the error red rather than the brand
            lime precisely because it should not feel like part of the
            product's normal chrome. */}
        <div className="flex items-center justify-center gap-2 border-b border-accent/30 bg-accent/10 px-4 py-1.5 text-caption text-accent">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Staff console — actions here affect real customer accounts
        </div>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
