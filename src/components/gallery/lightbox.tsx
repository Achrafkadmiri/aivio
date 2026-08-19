"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "./generation-card";

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  if (index === null) return null;
  const item = items[index];
  if (!item) return null;
  const isVideo = item.type !== "text-to-image";

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/90" />
        <Dialog.Content className="fixed inset-4 z-[60] flex flex-col items-center justify-center gap-4 outline-none sm:inset-10">
          <Dialog.Title className="sr-only">{item.prompt}</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 bg-surface/60"
              aria-label="Close"
            >
              <X className="size-5" />
            </Button>
          </Dialog.Close>

          {index > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(index - 1)}
              className="absolute top-1/2 left-0 -translate-y-1/2 bg-surface/60"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}
          {index < items.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate(index + 1)}
              className="absolute top-1/2 right-0 -translate-y-1/2 bg-surface/60"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </Button>
          )}

          <div className="flex max-h-full max-w-full items-center justify-center">
            {item.resultUrl ? (
              isVideo ? (
                <video
                  src={item.resultUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[75vh] max-w-full rounded-xl border border-line"
                />
              ) : (
                // Intentionally plain <img>: shown at natural aspect ratio
                // capped by viewport height, which next/image's fixed-box
                // (fill) or explicit-dimension model doesn't fit here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.resultUrl}
                  alt={item.prompt}
                  className="max-h-[75vh] max-w-full rounded-xl border border-line object-contain"
                />
              )
            ) : (
              <p className="text-body text-muted">No preview available.</p>
            )}
          </div>
          <p className="max-w-lg text-center text-body-sm text-muted">{item.prompt}</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
