"use client";

import Link from "next/link";
import { Sparkles, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useMe } from "@/hooks/use-me";
import { TIER_INFO, type Tier } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import type { GalleryItem } from "@/components/gallery/generation-card";
import { formatCredits } from "@/lib/utils";
import { CreditValue } from "@/components/credit-value";

type DashboardSummary = {
  usage: { creditsUsed: number; generationsCount: number };
  limit: number | null;
  tierInfo: (typeof TIER_INFO)[Tier];
  recentGenerations: GalleryItem[];
  dailyCounts: { date: string; count: number }[];
};

function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardSummary> => {
      const res = await apiFetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });
}

export function DashboardClient() {
  const { data: user } = useMe();
  const { data, isLoading } = useDashboardSummary();

  if (isLoading || !data || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const { usage, limit, tierInfo, recentGenerations, dailyCounts } = data;
  const usedPct = limit ? Math.min(100, Math.round((usage.creditsUsed / limit) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-heading font-bold text-ink">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-body-sm text-muted">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="compact">
          <p className="text-caption text-muted">Credits remaining</p>
          <p className="mt-2 text-heading font-bold text-ink">
            {limit === null ? "Unlimited" : formatCredits(Math.max(0, limit - usage.creditsUsed))}
          </p>
          {limit !== null && (
            <p className="mt-1 text-caption text-muted">
              <CreditValue credits={Math.max(0, limit - usage.creditsUsed)} />
            </p>
          )}
          {limit !== null && (
            <>
              <Progress value={usedPct} className="mt-4" />
              <p className="mt-2 text-caption text-muted">
                {formatCredits(usage.creditsUsed)} / {formatCredits(limit)} used this month
              </p>
            </>
          )}
        </Card>
        <Card variant="compact">
          <p className="text-caption text-muted">Generations this month</p>
          <p className="mt-2 text-heading font-bold text-ink">{usage.generationsCount}</p>
          <p className="mt-2 text-caption text-muted">On the {tierInfo.label} plan</p>
        </Card>
        <Card variant="compact">
          <p className="text-caption text-muted">Quick actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/generate" className={buttonVariants({ size: "sm" })}>
              <Sparkles className="size-4" /> New generation
            </Link>
          </div>
        </Card>
      </div>

      <Card variant="standard">
        <h2 className="text-subheading font-semibold text-ink">Usage — last 30 days</h2>
        <div className="mt-6">
          <UsageChart data={dailyCounts} />
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-subheading font-semibold text-ink">Recent generations</h2>
          <Link href="/my-gallery" className="text-body-sm text-brand hover:text-brand-hover">
            View all
          </Link>
        </div>
        <div className="mt-6">
          {recentGenerations.length === 0 ? (
            <Card variant="standard" className="flex flex-col items-center gap-4 py-16 text-center">
              <Video className="size-8 text-muted" aria-hidden="true" />
              <div>
                <p className="text-body text-ink-soft">No generations yet</p>
                <p className="mt-1 text-body-sm text-muted">
                  Create your first video or image to see it here.
                </p>
              </div>
              <Link href="/generate" className={buttonVariants()}>
                Generate your first video
              </Link>
            </Card>
          ) : (
            <GalleryGrid items={recentGenerations} />
          )}
        </div>
      </div>
    </div>
  );
}
