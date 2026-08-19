"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOWCASE_VIDEOS } from "@/lib/showcase-media";
import { apiFetch } from "@/lib/api-client";

const DISMISSED_KEY = "aivio:seedance-2-5-announcement";
// Skip the auth flow pages entirely — popping a promo over a login form is
// just noise, and pathname changes there shouldn't re-trigger the check.
const SUPPRESSED_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password"];

const HERO = SHOWCASE_VIDEOS.find((v) => v.id === "falcon-desert")!;
const THUMBS = ["chocolate-product", "studio-portrait", "man-dancing"]
  .map((id) => SHOWCASE_VIDEOS.find((v) => v.id === id)!)
  .filter(Boolean);

function AutoplayVideo({ url, className }: { url: string; className?: string }) {
  return (
    <video
      className={cn("h-full w-full object-cover", className)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source src={url} type="video/mp4" />
    </video>
  );
}

/**
 * One-time-per-session "new model" spotlight. Shown app-wide (mounted in the
 * root layout) so it reaches both signed-out visitors on the marketing site
 * and signed-in users in the app shell — the CTA destination is the only
 * thing that branches on auth state.
 */
export function ReleaseAnnouncementModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  const suppressed = SUPPRESSED_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (suppressed) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    let cancelled = false;
    apiFetch("/api/auth/me")
      .then((res) => {
        if (!cancelled) setConnected(res.ok);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setOpen(true);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount — this is a one-shot launch prompt,
    // not something that should re-evaluate on every route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setOpen(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  function handleTryNow() {
    dismiss();
    router.push(connected ? "/generate" : "/login?next=/generate");
  }

  if (suppressed) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/80 backdrop-blur-sm data-[state=open]:animate-fade-up" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-[28px] border border-line bg-surface-2 shadow-modal focus:outline-none",
          )}
        >
          <Dialog.Title className="sr-only">Seedance 2.5 is now live</Dialog.Title>
          <Dialog.Description className="sr-only">
            Announcement: Seedance 2.5 has been added to the model catalog.
          </Dialog.Description>

          <div className="relative aspect-[4/3] w-full bg-surface-3 sm:aspect-video">
            <AutoplayVideo url={HERO.url} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-2 via-surface-2/10 to-transparent" />

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-caption font-semibold text-warning">
                <Sparkles className="size-3.5" aria-hidden="true" />
                New release
              </span>
              <h2 className="mt-3 text-subheading font-bold text-white sm:text-heading">
                Seedance 2.5 is now live
              </h2>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <p className="text-body-sm text-ink-soft">
              Generate cinematic videos with Seedance 2.5 from text, images, and references — with
              native audio and up to 30s runtime.
            </p>

            {THUMBS.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {THUMBS.map((clip) => (
                  <div
                    key={clip.id}
                    className="aspect-square overflow-hidden rounded-xl border border-line bg-surface-3"
                  >
                    <AutoplayVideo url={clip.url} />
                  </div>
                ))}
              </div>
            )}

            <p className="text-body-sm text-muted">
              Choose Seedance 2.5 in the generator to create 480p and 720p videos with reference
              control and native audio.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4 sm:px-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-label font-medium text-muted transition-colors hover:text-ink-soft"
              >
                Maybe later
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleTryNow}
              className="rounded-full bg-warning px-6 py-3 text-label font-semibold text-surface transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-glow-sm active:translate-y-0"
            >
              Try 2.5 now
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
