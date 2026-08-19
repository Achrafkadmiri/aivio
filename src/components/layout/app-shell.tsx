"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useMe } from "@/hooks/use-me";
import { Spinner } from "@/components/ui/spinner";
import {
  LayoutDashboard,
  Sparkles,
  Images,
  FolderKanban,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Zap,
} from "lucide-react";
import { cn, formatCredits } from "@/lib/utils";
import { CurrencySelector } from "@/components/currency-selector";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";

type UsageResponse = { credits_used_this_month: number; credits_limit: number | null };

function CreditsBadge() {
  const { data } = useQuery({
    queryKey: ["usage"],
    queryFn: async (): Promise<UsageResponse> => {
      const res = await apiFetch("/api/user/usage");
      if (!res.ok) throw new Error("Failed to load usage");
      return res.json();
    },
  });

  if (!data) return null;

  const remaining =
    data.credits_limit !== null ? Math.max(0, data.credits_limit - data.credits_used_this_month) : null;

  return (
    <Link
      href="/settings/billing"
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-label text-ink-soft transition-colors hover:border-border-strong"
      title="Credits remaining this month"
    >
      <Zap className="size-3.5 text-brand" aria-hidden="true" />
      <span className="font-semibold">{remaining === null ? "∞" : formatCredits(remaining)}</span>
      <span className="hidden text-muted sm:inline">credits</span>
    </Link>
  );
}

// Grouped into labeled sections (rather than one flat list) so the sidebar
// reads more like a real workspace nav — echoes ArtCraft's Create/Studio/
// Assets grouping, sized down to what this app actually has.
const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/generate", label: "Generate", icon: Sparkles },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/my-gallery", label: "Gallery", icon: Images },
      { href: "/collections", label: "Collections", icon: FolderKanban },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to log out");
    },
    onSuccess: () => {
      // Drop all cached data (user, usage, dashboard, etc.) so nothing from
      // this session leaks into the next — otherwise stale react-query cache
      // (e.g. useMe()) could still look "authenticated" for a bit after the
      // session cookie is cleared, or leak into a different user's session.
      queryClient.clear();
      router.push("/");
      router.refresh();
    },
  });
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-4 pb-2 text-caption font-medium tracking-wide text-text-tertiary uppercase">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-4 py-3 text-label transition-colors",
                    active
                      ? "bg-brand/10 text-ink before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[image:var(--gradient-primary)]"
                      : "text-muted hover:bg-white/5 hover:text-ink-soft",
                  )}
                >
                  <item.icon className="size-4.5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const logout = useLogout();
  const { data: user, isLoading, isError } = useMe();
  const initial = user?.name.slice(0, 1).toUpperCase() ?? "";

  // Route protection lives here (client-side) rather than in proxy.ts,
  // because only the browser can see the cross-site session cookie set by
  // the Edge Function — see the comment in src/proxy.ts.
  useEffect(() => {
    if (isError) {
      const next = window.location.pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isError, router]);

  if (isLoading || isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-app">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface-3 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="flex h-16 items-center border-b border-line px-4">
          <Logo />
        </div>
        <NavLinks />
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-label text-muted transition-colors hover:bg-white/5 hover:text-ink-soft"
          >
            <LogOut className="size-4.5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface-app/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <Logo />
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <CurrencySelector className="hidden sm:inline-flex" />
            <CreditsBadge />

            <DropdownRoot>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-caption font-semibold text-surface">
                    {initial}
                  </span>
                  <span className="hidden text-label text-ink-soft sm:inline">{user?.name}</span>
                </button>
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-4 py-2">
                  <p className="text-label text-ink-soft">{user?.name}</p>
                  <p className="truncate text-caption text-muted">{user?.email}</p>
                </div>
                <DropdownSeparator />
                <DropdownItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 inline size-4" /> Profile
                  </Link>
                </DropdownItem>
                <DropdownItem asChild>
                  <Link href="/settings/billing">
                    <Zap className="mr-2 inline size-4" /> Billing
                  </Link>
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  onSelect={() => logout.mutate()}
                  className="text-accent data-[highlighted]:text-accent"
                >
                  <LogOut className="mr-2 inline size-4" /> Log out
                </DropdownItem>
              </DropdownContent>
            </DropdownRoot>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-app lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </Button>
          </div>
          <NavLinks onNavigate={() => setDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
}
