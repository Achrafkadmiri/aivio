"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { useAdminStats } from "@/hooks/use-admin";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "warn" | "alert";
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "rounded-2xl border bg-surface-2 p-5 transition-colors",
        tone === "alert"
          ? "border-accent/40"
          : tone === "warn"
            ? "border-warning/40"
            : "border-line",
        href && "hover:border-border-strong",
      )}
    >
      <p className="text-caption tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "font-display mt-2 text-heading font-bold",
          tone === "alert" ? "text-accent" : tone === "warn" ? "text-warning" : "text-ink",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-caption text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminOverviewPage() {
  const { data, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-body-sm text-accent">
        Couldn&apos;t load stats.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-heading font-bold text-ink">Overview</h1>
        <p className="mt-2 text-body-sm text-muted">
          Live counts straight from the database — no sampling, no cache.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-label font-medium text-ink-soft">Accounts</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Stat label="Total users" value={data.totalUsers} href="/admin/users" />
          <Stat label="New this week" value={data.newUsers7d} sub="Signed up in the last 7 days" />
          <Stat
            label="Paid users"
            value={data.paidUsers}
            sub={`${data.totalUsers ? Math.round((data.paidUsers / data.totalUsers) * 100) : 0}% of accounts`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-label font-medium text-ink-soft">Generations</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total" value={data.totalGenerations} href="/admin/generations" />
          <Stat label="Last 24h" value={data.generations24h} />
          <Stat
            label="In flight"
            value={data.inFlight}
            sub="pending, queued or processing"
            tone={data.inFlight > 20 ? "warn" : "default"}
            href="/admin/generations"
          />
          <Stat
            label="Failed 24h"
            value={data.failed24h}
            tone={data.failed24h > 0 ? "alert" : "default"}
            href="/admin/generations"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-label font-medium text-ink-soft">Credits &amp; support</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Stat
            label="Credits spent (30d)"
            value={data.creditsSpent30d.toLocaleString()}
            sub="Sum of costCredits on generations"
            href="/admin/credits"
          />
          <Stat
            label="Unread messages"
            value={data.unreadMessages}
            tone={data.unreadMessages > 0 ? "warn" : "default"}
            href="/admin/support"
          />
        </div>
      </section>

      {/* Stated rather than quietly omitted: an operator looking for revenue
          on this page needs to know why it isn't here, otherwise the absence
          reads as a bug. */}
      <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-5">
        <p className="flex items-center gap-2 text-label font-medium text-ink-soft">
          <Info className="size-4 text-muted" aria-hidden="true" />
          Not shown yet, on purpose
        </p>
        <ul className="space-y-2 text-body-sm text-muted">
          <li className="flex items-start gap-2">
            <AlertTriangle className="mt-1 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <strong className="text-ink-soft">Revenue.</strong> Payments are simulated in this
              build, so any figure here would be invented rather than measured.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="mt-1 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span>
              <strong className="text-ink-soft">Margin.</strong> <code>Generation</code> has no
              provider-cost column, so cost can only be re-derived from the same estimate that set
              the price — which can never reveal that the estimate is wrong.
            </span>
          </li>
        </ul>
        <Link
          href="/admin/generations"
          className="inline-flex items-center gap-1.5 text-body-sm text-brand hover:underline"
        >
          Review generations instead
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
