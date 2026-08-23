"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MoreVertical, Download, Share2, Copy, Trash2, FolderPlus, FolderMinus, AlertCircle } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DropdownRoot, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, truncate } from "@/lib/utils";

// Only starts loading once the tile scrolls into view, then pauses/resumes
// on exit/re-entry (without re-fetching) for the rest of its life — so a
// long gallery page doesn't keep dozens of offscreen clips decoding at once.
function LazyVideoTile({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasLoadedOnce(true);
      },
      { rootMargin: "150px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (inView) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [inView, hasLoadedOnce]);

  return (
    <div ref={containerRef} className="h-full w-full bg-surface-3">
      {hasLoadedOnce && (
        <video
          ref={videoRef}
          className={cn("h-full w-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          onLoadedData={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

export type GalleryItem = {
  id: string;
  type: string;
  model: string;
  prompt: string;
  status: string;
  progressPercent: number;
  resultUrl: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  completed: "success",
  processing: "brand",
  queued: "neutral",
  pending: "neutral",
  failed: "accent",
};

export function GenerationCard({
  item,
  onOpen,
  onDelete,
  onDuplicate,
  onAddToCollection,
  onRemoveFromCollection,
  onTogglePublic,
}: {
  item: GalleryItem;
  onOpen: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddToCollection?: () => void;
  onRemoveFromCollection?: () => void;
  onTogglePublic?: () => void;
}) {
  const isVideo = item.type !== "text-to-image";
  const hasActions = Boolean(
    onDelete || onDuplicate || onAddToCollection || onRemoveFromCollection || onTogglePublic,
  );

  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-border-strong hover:shadow-glow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 h-full w-full cursor-pointer"
        aria-label={`Open ${item.prompt}`}
      >
        {item.status === "completed" && item.resultUrl ? (
          isVideo ? (
            <LazyVideoTile src={item.resultUrl} alt={item.prompt} />
          ) : (
            <Image
              src={item.resultUrl}
              alt={item.prompt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          )
        ) : item.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-3 p-4 text-center">
            <AlertCircle className="size-6 text-accent" aria-hidden="true" />
            <span className="text-caption text-muted">Generation failed</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-3">
            <Spinner />
            <span className="font-mono text-caption text-muted">{item.progressPercent}%</span>
          </div>
        )}
      </button>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/0 to-black/40 p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={STATUS_VARIANT[item.status] ?? "neutral"} className="pointer-events-none">
            {item.status}
          </Badge>
          {hasActions && (
            <div className="pointer-events-auto">
              <DropdownRoot>
                <DropdownTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-surface/60"
                    aria-label="Generation actions"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownContent>
                  {item.resultUrl && (
                    <DropdownItem asChild>
                      <a href={item.resultUrl} download target="_blank" rel="noreferrer">
                        <Download className="mr-2 inline size-4" /> Download
                      </a>
                    </DropdownItem>
                  )}
                  {onDuplicate && (
                    <DropdownItem onSelect={onDuplicate}>
                      <Copy className="mr-2 inline size-4" /> Duplicate
                    </DropdownItem>
                  )}
                  {onAddToCollection && (
                    <DropdownItem onSelect={onAddToCollection}>
                      <FolderPlus className="mr-2 inline size-4" /> Add to collection
                    </DropdownItem>
                  )}
                  {onRemoveFromCollection && (
                    <DropdownItem onSelect={onRemoveFromCollection}>
                      <FolderMinus className="mr-2 inline size-4" /> Remove from collection
                    </DropdownItem>
                  )}
                  {onTogglePublic && (
                    <DropdownItem onSelect={onTogglePublic}>
                      <Share2 className="mr-2 inline size-4" />{" "}
                      {item.isPublic ? "Make private" : "Share publicly"}
                    </DropdownItem>
                  )}
                  {onDelete && (
                    <DropdownItem onSelect={onDelete} className="text-accent data-[highlighted]:text-accent">
                      <Trash2 className="mr-2 inline size-4" /> Delete
                    </DropdownItem>
                  )}
                </DropdownContent>
              </DropdownRoot>
            </div>
          )}
        </div>
        <p className="pointer-events-none line-clamp-2 font-mono text-caption text-ink-soft">
          {truncate(item.prompt, 90)}
        </p>
      </div>
    </div>
  );
}
