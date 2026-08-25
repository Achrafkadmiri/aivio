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
  ChevronLeft,
} from "lucide-react";
import { cn, formatCredits } from "@/lib/utils";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownRoot,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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
// Assets grouping, sized down to what this app actually has. The active
// item always uses the one brand color (see NavItem below) — no per-section
// wayfinding colors anymore.
const NAV_SECTIONS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
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

function NavItem({
  item,
  active,
  onNavigate,
  collapsed,
}: {
  item: (typeof NAV_SECTIONS)[number]["items"][number];
  active: boolean;
  onNavigate?: () => void;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "font-display relative flex items-center gap-3 rounded-xl py-2 text-label font-medium transition-colors",
        // Collapsed: size the pill to its content (icon only) and center it
        // in the rail, instead of a block-level Link stretching to the full
        // rail width — a full-width active wash behind a lone centered icon
        // rendered as an oversized blob.
        collapsed ? "mx-auto w-fit px-2" : "pr-4 pl-3",
        active
          ? // The accent bar's color MUST stay under the before: variant —
            // a bare `bg-brand` here (no `before:` prefix) would paint the
            // whole link solid instead of just the 4px bar, which is
            // exactly the bug that made the active icon disappear.
            "bg-brand/10 text-ink before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-brand"
          : "text-muted hover:bg-white/5 hover:text-ink-soft",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active ? "bg-brand/15" : "bg-white/5",
        )}
      >
        <item.icon className={cn("size-4", active ? "text-brand" : "text-muted")} aria-hidden="true" />
      </span>
      {!collapsed && item.label}
    </Link>
  );

  // Icon-only rail needs the label back somewhere — a tooltip on hover.
  // Skipped when expanded since the label is already right there as text.
  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function NavLinks({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="px-4 pb-2 text-caption font-medium tracking-wide text-text-tertiary uppercase">
              {section.label}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  active={active}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
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

  // Same reasoning as the marketing Header: a hairline border sitting under
  // the bar on every single app page (including ones shorter than the
  // viewport, with nothing to scroll) reads as static boilerplate. Only draw
  // it once there's actually scrolled content underneath to separate from.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Desktop-only icon rail toggle — mobile already collapses the whole nav
  // behind the hamburger drawer, so a second "shrink to icons" mode there
  // wouldn't do anything useful. Starts expanded (matching the server-
  // rendered markup, so there's no hydration mismatch) and reads the saved
  // preference on mount; that one-frame flash from expanded to the stored
  // collapsed state is the standard, accepted trade-off for a client-only
  // preference like this with no server-side signal (e.g. a cookie) to read
  // it from up front. Also listens for the "storage" event so toggling the
  // sidebar in one tab keeps other open tabs of the app in sync.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const sync = () => setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  if (isLoading || isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-app lg:gap-3">
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col rounded-2xl border border-line bg-surface-sidebar shadow-floating transition-[width] duration-300 lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:flex lg:h-[calc(100vh-1.5rem)]",
          collapsed ? "lg:w-16" : "lg:w-60",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface-3 text-muted shadow-card transition-colors hover:border-border-strong hover:text-ink-soft"
        >
          <ChevronLeft className={cn("size-3.5 transition-transform duration-300", collapsed && "rotate-180")} aria-hidden="true" />
        </button>

        <div className={cn("flex h-16 items-center border-b border-line", collapsed ? "justify-center px-2" : "px-4")}>
          <Logo iconOnly={collapsed} />
        </div>
        <NavLinks collapsed={collapsed} />
        <div className="border-t border-line p-4">
          {collapsed ? (
            <Tooltip content="Log out" side="right">
              <button
                type="button"
                onClick={() => logout.mutate()}
                aria-label="Log out"
                className="flex w-full items-center justify-center rounded-xl py-3 text-label text-muted transition-colors hover:bg-white/5 hover:text-ink-soft"
              >
                <LogOut className="size-4.5" aria-hidden="true" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-label text-muted transition-colors hover:bg-white/5 hover:text-ink-soft"
            >
              <LogOut className="size-4.5" aria-hidden="true" />
              Log out
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-4 transition-colors duration-300 lg:px-8",
            scrolled
              ? "border-line bg-surface-app/80 backdrop-blur-md"
              : "border-transparent bg-surface-app",
          )}
        >
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
                  className="flex items-center gap-2.5 rounded-full border border-line bg-surface-2 py-1.5 pr-3 pl-1.5 transition-colors hover:border-border-strong hover:bg-surface-3"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand text-caption font-semibold text-white">
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
