"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
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
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";

type UsageResponse = { credit_balance: number };

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

  return (
    <Link
      href="/settings/billing"
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-label text-ink-soft transition-colors hover:border-border-strong"
      title="Credits remaining"
    >
      <Zap className="size-3.5 text-brand" aria-hidden="true" />
      <span className="font-semibold">{formatCredits(data.credit_balance)}</span>
      <span className="hidden text-muted sm:inline">credits</span>
    </Link>
  );
}

// Grouped into labeled sections (rather than one flat list) so the sidebar
// reads more like a real workspace nav — echoes ArtCraft's Create/Studio/
// Assets grouping, sized down to what this app actually has. Each item also
// carries a category `color`, one of the four solid hues from the palette
// (ember/teal/amber/rust — see globals.css) — an ArtCraft-style colored
// icon chip per section instead of one uniform gradient/brand tint on
// every row, so the sidebar itself helps with wayfinding. Settings stays
// neutral on purpose: a utility/account section, not "content," so it
// doesn't compete for attention with the four content-bearing colors.
type NavColor = "brand" | "teal" | "brandSoft" | "brandDeep" | "neutral";
const NAV_SECTIONS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard; color: NavColor }[] }[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "teal" },
      { href: "/generate", label: "Generate", icon: Sparkles, color: "brand" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/my-gallery", label: "Gallery", icon: Images, color: "brandSoft" },
      { href: "/collections", label: "Collections", icon: FolderKanban, color: "brandDeep" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings, color: "neutral" }],
  },
];

// Tailwind can't construct class names from a template string at runtime —
// its scanner needs every full class name to appear literally somewhere in
// source — so this is a static lookup rather than `bg-${color}/15`.
const NAV_COLOR_STYLES: Record<NavColor, { chip: string; icon: string; bar: string; wash: string }> = {
  brand: { chip: "bg-brand/15", icon: "text-brand", bar: "bg-brand", wash: "bg-brand/10" },
  teal: { chip: "bg-accent-teal/15", icon: "text-accent-teal", bar: "bg-accent-teal", wash: "bg-accent-teal/10" },
  brandSoft: { chip: "bg-brand-soft/15", icon: "text-brand-soft", bar: "bg-brand-soft", wash: "bg-brand-soft/10" },
  brandDeep: { chip: "bg-brand-deep/15", icon: "text-brand-deep", bar: "bg-brand-deep", wash: "bg-brand-deep/10" },
  neutral: { chip: "bg-white/8", icon: "text-muted", bar: "bg-ink", wash: "bg-white/6" },
};

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
              const styles = NAV_COLOR_STYLES[item.color];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "font-display relative flex items-center gap-3 rounded-xl py-2 pr-4 pl-3 text-label font-medium transition-colors",
                    active
                      ? cn(styles.wash, "text-ink before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full", styles.bar)
                      : "text-muted hover:bg-white/5 hover:text-ink-soft",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      active ? styles.chip : "bg-white/5",
                    )}
                  >
                    <item.icon
                      className={cn("size-4", active ? styles.icon : "text-muted")}
                      aria-hidden="true"
                    />
                  </span>
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
    <div className="flex min-h-screen bg-surface-app lg:gap-3">
      <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-line bg-surface-sidebar shadow-floating lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:flex lg:h-[calc(100vh-1.5rem)]">
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
            <CreditsBadge />

            <DropdownRoot>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand text-caption font-semibold text-white">
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

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/80 backdrop-blur-sm lg:hidden" />
          <Dialog.Content
            className={cn(
              "animate-sheet-left fixed inset-y-3 left-3 z-[60] flex w-64 max-w-[calc(100%-1.5rem)]",
              "flex-col overflow-y-auto rounded-2xl border border-line bg-surface-sidebar shadow-modal",
              "focus:outline-none lg:hidden",
            )}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <Logo />
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close menu">
                  <X className="size-5" />
                </Button>
              </Dialog.Close>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
