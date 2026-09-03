"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  Send,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { downloadGenerationResult } from "@/lib/download";
import { cn } from "@/lib/utils";
import { PlatformIcon, platformLabel } from "./platform-icons";
import {
  useCancelSocialPost,
  useCreateSocialPost,
  useSocialAccounts,
  useSocialPosts,
  type PlatformInfo,
  type SocialAccount,
  type SocialPlatform,
  type SocialPost,
} from "@/hooks/use-social";

/**
 * Publish a finished generation to the creator's own linked accounts.
 *
 * The panel is deliberately useful before any platform is connected: an
 * unconfigured or unlinked platform offers the manual route instead —
 * caption and hashtags on the clipboard, file on disk — because the API
 * route is gated behind each platform's app review, and "come back in six
 * weeks" is not a feature.
 */

// Per-platform hashtag habits, which are not interchangeable: YouTube reads
// tags as a field and treats a wall of them in the description as spam,
// while TikTok and Instagram only see hashtags written into the caption.
// This is for the *manual* export — the API path lets each adapter format
// its own.
const TAG_STYLE: Record<SocialPlatform, "in-caption" | "separate"> = {
  tiktok: "in-caption",
  instagram: "in-caption",
  facebook: "in-caption",
  youtube: "separate",
};


// Module-level so the "still loading" fallback is referentially stable —
// a fresh [] each render would invalidate the memos below every time.
const NO_ACCOUNTS: SocialAccount[] = [];
const NO_PLATFORMS: PlatformInfo[] = [];

function statusTone(status: SocialPost["status"]) {
  if (status === "published") return "text-success";
  if (status === "failed") return "text-accent";
  if (status === "cancelled") return "text-muted";
  return "text-ink-soft";
}

/** The local clock as a value <input type="datetime-local"> accepts.
 *  toISOString would be UTC, which silently shifts the creator's chosen time
 *  by their offset — the one bug nobody notices until a post goes out at 3am. */
function toLocalInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function CreatorTools({
  generationId,
  isVideo,
  defaultCaption,
  className,
}: {
  generationId: string;
  isVideo: boolean;
  /** Seeds the caption from the generation's prompt — the creator almost
   *  always rewrites it, but an empty box is a worse starting point. */
  defaultCaption?: string;
  className?: string;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const { data, isLoading } = useSocialAccounts();
  const { data: posts } = useSocialPosts(generationId);
  const createPost = useCreateSocialPost();
  const cancelPost = useCancelSocialPost();

  const [selected, setSelected] = useState<string[]>([]);
  const [caption, setCaption] = useState(defaultCaption?.slice(0, 2200) ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)),
  );

  const accounts = data?.accounts ?? NO_ACCOUNTS;
  const platforms = data?.platforms ?? NO_PLATFORMS;
  const mediaKind = isVideo ? "video" : "image";

  const accountsByPlatform = useMemo(() => {
    const map = new Map<SocialPlatform, SocialAccount[]>();
    for (const account of accounts) {
      map.set(account.platform, [...(map.get(account.platform) ?? []), account]);
    }
    return map;
  }, [accounts]);

  // The composer counts down against the strictest selected platform: a
  // caption that fits YouTube but not TikTok would be rejected at publish
  // time, minutes later, with the creator no longer looking.
  const captionLimit = useMemo(() => {
    const chosen = platforms.filter((p) =>
      accounts.some((a) => selected.includes(a.id) && a.platform === p.platform),
    );
    if (chosen.length === 0) return 2200;
    return Math.min(...chosen.map((p) => p.captionLimit));
  }, [platforms, accounts, selected]);

  const overLimit = caption.length > captionLimit;

  function toggleAccount(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function commitTag() {
    const cleaned = tagDraft.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!cleaned) return;
    if (tags.length >= 30) {
      toast({ title: "That's the 30-tag limit", variant: "error" });
      return;
    }
    if (!tags.includes(cleaned)) setTags((prev) => [...prev, cleaned]);
    setTagDraft("");
  }

  async function submit() {
    if (selected.length === 0) return;
    try {
      await createPost.mutateAsync({
        generationId,
        accountIds: selected,
        caption,
        tags,
        // Only sent when actually scheduling — the server reads its absence
        // as "now", which keeps both paths on one code path.
        scheduledFor: scheduled ? new Date(scheduledAt).toISOString() : undefined,
      });
      setSelected([]);
      toast({
        title: scheduled ? "Scheduled" : "Queued for publishing",
        description: scheduled
          ? `Goes out ${new Date(scheduledAt).toLocaleString()}.`
          : "It'll go out within a minute.",
        variant: "success",
      });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    }
  }

  /** The fallback that makes this panel worth opening on day one: the
   *  caption formatted the way that platform expects, plus the file. */
  async function manualExport(platform: PlatformInfo) {
    const rendered =
      TAG_STYLE[platform.platform] === "in-caption" && tags.length
        ? `${caption}\n\n${tags.map((t) => `#${t}`).join(" ")}`
        : caption;
    try {
      await navigator.clipboard.writeText(rendered);
      toast({
        title: `Caption copied for ${platform.label}`,
        description:
          TAG_STYLE[platform.platform] === "separate"
            ? "Tags go in YouTube's own tags field, not the description."
            : "Hashtags are included at the end.",
        variant: "success",
      });
    } catch {
      toast({ title: "Couldn't copy the caption", variant: "error" });
    }
    await downloadGenerationResult(generationId).catch(() => {
      toast({ title: "Couldn't download the file", variant: "error" });
    });
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-body-sm text-muted", className)}>
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading creator tools…
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {data?.simulated && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/5 p-3 text-caption text-ink-soft">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
          Simulated mode: posts complete without anything reaching a real platform.
        </p>
      )}

      {/* Nothing linked yet. Four "Not connected" rows technically say this,
          but they read as a broken list rather than a next step — so the
          block collapses to one instruction with one button, and the export
          fallback stays reachable underneath it. */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface-3/40 p-5 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-brand/10">
            <Link2 className="size-5 text-brand" aria-hidden="true" />
          </span>
          <p className="mt-3 text-label text-ink">No accounts connected</p>
          <p className="mx-auto mt-1 max-w-xs text-caption text-muted">
            Link TikTok, YouTube, Facebook or Instagram once, and you can publish straight from
            here — on a schedule if you want.
          </p>
          <Link href="/settings/social" className={buttonVariants({ size: "sm", className: "mt-4" })}>
            <Link2 className="size-4" aria-hidden="true" />
            Connect an account
          </Link>
          <div className="mt-4 border-t border-border-subtle pt-3">
            <p className="text-caption text-muted">Or export and post by hand</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.platform}
                  variant="secondary"
                  size="icon"
                  aria-label={`Copy caption and download for ${platform.label}`}
                  title={`Copy caption and download for ${platform.label}`}
                  onClick={() => manualExport(platform)}
                >
                  <PlatformIcon platform={platform.platform} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div>
        <p className="text-caption text-muted">Post to</p>
        <div className="mt-2 space-y-2">
          {platforms.map((platform) => {
            const linked = accountsByPlatform.get(platform.platform) ?? [];
            const takesThis = platform.accepts.includes(mediaKind);

            if (linked.length === 0 || !takesThis) {
              return (
                <div
                  key={platform.platform}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlatformIcon platform={platform.platform} labelled />
                    <p className="text-caption text-muted">
                      {!takesThis
                        ? `Doesn't take ${mediaKind} from this app`
                        : platform.configured
                          ? "Not connected"
                          : "Not set up on this server yet"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => manualExport(platform)}>
                      <Copy className="size-3.5" aria-hidden="true" />
                      <Download className="size-3.5" aria-hidden="true" />
                      Export
                    </Button>
                    {platform.configured && takesThis && (
                      <Link
                        href="/settings/social"
                        className="inline-flex items-center gap-1 self-center text-caption text-brand hover:underline"
                      >
                        Connect <ExternalLink className="size-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            }

            return linked.map((account) => {
              const active = selected.includes(account.id);
              const stale = account.status !== "active";
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => !stale && toggleAccount(account.id)}
                  aria-pressed={active}
                  disabled={stale}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-line hover:border-border-strong",
                    stale && "opacity-60",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlatformIcon platform={platform.platform} labelled />
                    <p className="truncate text-body-sm text-ink-soft">
                      {stale ? "Reconnect this account in Settings" : account.displayName}
                    </p>
                  </div>
                  {active && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                </button>
              );
            });
          })}
        </div>
      </div>
      )}

      {/* Caption */}
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="social-caption">Description</Label>
          <span className={cn("text-caption", overLimit ? "text-accent" : "text-muted")}>
            {caption.length}/{captionLimit}
          </span>
        </div>
        <textarea
          id="social-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="What's this clip about?"
          className="mt-1.5 w-full rounded-xl border border-line bg-surface-dark p-3 text-body-sm text-ink outline-none placeholder:text-muted focus:border-border-strong"
        />
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="social-tags">Tags</Label>
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-caption text-ink-soft"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  aria-label={`Remove ${tag}`}
                  className="text-muted hover:text-ink"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input
          id="social-tags"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            // Comma as well as Enter: people paste "a, b, c" out of habit,
            // and Enter alone would submit the lot as one malformed tag.
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitTag();
            }
          }}
          onBlur={commitTag}
          placeholder="Add a tag and press Enter"
          className="mt-1.5"
        />
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-body-sm text-ink-soft">
          <input
            type="checkbox"
            checked={scheduled}
            onChange={(e) => setScheduled(e.target.checked)}
            className="size-4 accent-[color:var(--color-brand)]"
          />
          <CalendarClock className="size-4 text-muted" aria-hidden="true" />
          Schedule for later
        </label>
        {scheduled && (
          <Input
            type="datetime-local"
            value={scheduledAt}
            min={toLocalInputValue(new Date())}
            onChange={(e) => setScheduledAt(e.target.value)}
            aria-label="Publish at"
          />
        )}
      </div>

      <Button
        className="w-full"
        disabled={selected.length === 0 || overLimit}
        loading={createPost.isPending}
        onClick={submit}
      >
        <Send className="size-4" aria-hidden="true" />
        {selected.length === 0
          ? "Pick an account"
          : scheduled
            ? `Schedule ${selected.length} post${selected.length > 1 ? "s" : ""}`
            : `Publish to ${selected.length} account${selected.length > 1 ? "s" : ""}`}
      </Button>

      {/* What's already been queued for this generation */}
      {posts && posts.length > 0 && (
        <div className="space-y-2 border-t border-border-subtle pt-3">
          <p className="text-caption text-muted">Posts</p>
          {posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-body-sm text-ink-soft">
                  <PlatformIcon platform={post.platform} className="size-4" labelled />
                  {post.accountName ?? platformLabel(post.platform)}
                  <span className={cn("text-caption", statusTone(post.status))}>
                    · {post.status}
                  </span>
                </p>
                {post.status === "scheduled" && (
                  <p className="text-caption text-muted">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </p>
                )}
                {post.errorMessage && (
                  <p
                    className={cn(
                      "text-caption",
                      post.status === "failed" ? "text-accent" : "text-muted",
                    )}
                  >
                    {post.errorMessage}
                  </p>
                )}
                {post.providerUrl && (
                  <a
                    href={post.providerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-caption text-brand hover:underline"
                  >
                    View post <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </div>
              {post.status === "scheduled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Cancel this scheduled post?",
                      description: "It won't go out. You can schedule it again afterwards.",
                      confirmLabel: "Cancel post",
                      cancelLabel: "Keep it",
                    });
                    if (ok) cancelPost.mutate(post.id);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
