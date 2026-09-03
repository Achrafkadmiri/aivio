"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Link2, Loader2, Unplug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { formatDate } from "@/lib/utils";
import {
  useConnectSocial,
  useDisconnectSocial,
  useSocialAccounts,
  type SocialAccount,
} from "@/hooks/use-social";

/** What each platform can actually do once connected, stated up front.
 *  These aren't our restrictions — they're the platforms' own rules about
 *  who may post through an API, and finding out afterwards is worse. */
const REQUIREMENTS: Record<string, string> = {
  tiktok: "Posts land in your TikTok drafts unless the app has passed TikTok's content-posting audit.",
  youtube: "Needs a YouTube channel on the Google account. Uploads stay private until Google verifies the app.",
  facebook: "Posts to a Facebook Page you manage — Facebook's API can't post to a personal profile.",
  instagram: "Needs an Instagram Business or Creator account linked to a Facebook Page.",
};

export function SocialAccounts() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useSocialAccounts();
  const connect = useConnectSocial();
  const disconnect = useDisconnectSocial();

  // The OAuth callback redirects back here with its outcome in the query
  // string, since it has no other way to talk to this page. Consumed once
  // and stripped, so a refresh doesn't re-announce a week-old connection.
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");
  useEffect(() => {
    if (!connected && !error) return;
    if (connected) {
      toast({ title: `Connected ${connected}`, variant: "success" });
    } else if (error) {
      toast({ title: "Couldn't connect that account", description: error, variant: "error" });
    }
    router.replace("/settings/social");
  }, [connected, error, toast, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="py-16 text-center text-body-sm text-muted">Couldn&apos;t load your accounts.</p>;
  }

  const byPlatform = new Map<string, SocialAccount[]>();
  for (const account of data.accounts) {
    byPlatform.set(account.platform, [...(byPlatform.get(account.platform) ?? []), account]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subheading font-semibold text-ink">Social accounts</h2>
        <p className="mt-1 text-body-sm text-muted">
          Connect a platform to publish finished generations straight from the app — with a
          description, tags and a scheduled time.
        </p>
      </div>

      {data.simulated && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/5 p-3 text-body-sm text-ink-soft">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          Simulated mode is on: connecting and publishing both complete without contacting a real
          platform. Turn off <code className="font-mono">SOCIAL_SIMULATE</code> once real
          credentials are in place.
        </p>
      )}

      <Card variant="standard" className="divide-y divide-line p-0">
        {data.platforms.map((platform) => {
          const linked = byPlatform.get(platform.platform) ?? [];
          return (
            <div key={platform.platform} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-label text-ink">{platform.label}</p>
                  <p className="mt-1 text-caption text-muted">
                    {platform.configured
                      ? REQUIREMENTS[platform.platform]
                      : "No credentials on this server yet — you can still export the caption and file and post by hand."}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!platform.configured || connect.isPending}
                  onClick={() =>
                    connect.mutate(platform.platform, {
                      onError: (err) =>
                        toast({ title: (err as Error).message, variant: "error" }),
                    })
                  }
                >
                  {connect.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Link2 className="size-3.5" aria-hidden="true" />
                  )}
                  {linked.length > 0 ? "Connect another" : "Connect"}
                </Button>
              </div>

              {linked.map((account) => (
                <div
                  key={account.id}
                  className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-sm text-ink-soft">{account.displayName}</p>
                    <p className="text-caption text-muted">
                      {account.status === "active"
                        ? `Connected ${formatDate(account.connectedAt)}`
                        : "Access expired — reconnect to keep posting"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Disconnect ${account.displayName}`}
                    title="Disconnect"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Disconnect ${account.displayName}?`,
                        description:
                          "Anything still scheduled to this account is cancelled. Posts already published stay up.",
                        confirmLabel: "Disconnect",
                        tone: "danger",
                      });
                      if (ok) {
                        disconnect.mutate(account.id, {
                          onError: (err) =>
                            toast({ title: (err as Error).message, variant: "error" }),
                          onSuccess: () => toast({ title: "Disconnected", variant: "success" }),
                        });
                      }
                    }}
                  >
                    <Unplug className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
