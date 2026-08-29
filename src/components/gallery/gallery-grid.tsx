"use client";

import { useState } from "react";
import { useLikedGenerations } from "@/hooks/use-liked-generations";
import { GenerationCard, type GalleryItem } from "./generation-card";
import { PreviewModal, type PreviewAuthor } from "./preview-modal";

export function GalleryGrid({
  items,
  author,
  onDelete,
  onDuplicate,
  onAddToCollection,
  onRemoveFromCollection,
  onTogglePublic,
}: {
  items: GalleryItem[];
  /** Shown in the preview modal's header. Pass it only where the viewer is
   *  known to be the owner (my gallery, dashboard, own collections) — the
   *  public gallery has no author data, and guessing "you" there would
   *  credit the wrong person. */
  author?: PreviewAuthor;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddToCollection?: (id: string) => void;
  onRemoveFromCollection?: (id: string) => void;
  onTogglePublic?: (id: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openItem = openIndex === null ? null : items[openIndex];
  const { liked, toggleLike } = useLikedGenerations();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <GenerationCard
            key={item.id}
            item={item}
            onOpen={() => setOpenIndex(i)}
            liked={liked.has(item.id)}
            onToggleLike={() => toggleLike(item.id)}
          />
        ))}
      </div>
      <PreviewModal
        items={items}
        index={openIndex}
        author={author}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
        onDelete={onDelete && openItem ? () => onDelete(openItem.id) : undefined}
        onDuplicate={onDuplicate && openItem ? () => onDuplicate(openItem.id) : undefined}
        onAddToCollection={
          onAddToCollection && openItem ? () => onAddToCollection(openItem.id) : undefined
        }
        onRemoveFromCollection={
          onRemoveFromCollection && openItem
            ? () => onRemoveFromCollection(openItem.id)
            : undefined
        }
        onTogglePublic={onTogglePublic && openItem ? () => onTogglePublic(openItem.id) : undefined}
      />
    </>
  );
}
