"use client";

import { useState } from "react";
import { useToggleLike } from "@/hooks/use-generation-likes";
import { useMe } from "@/hooks/use-me";
import { useToast } from "@/components/ui/toast";
import { GenerationCard, type GalleryItem } from "./generation-card";
import { PreviewModal, type PreviewAuthor } from "./preview-modal";

export function GalleryGrid({
  items,
  author,
  viewerIsOwner = false,
  showAuthor = false,
  onDelete,
  onDuplicate,
  onAddToCollection,
  onRemoveFromCollection,
  onTogglePublic,
}: {
  items: GalleryItem[];
  /** Who made these. The public gallery has no author data, and guessing
   *  "you" there would credit the wrong person, so it passes nothing. */
  author?: PreviewAuthor;
  /** True on the owner's own surfaces (my gallery, dashboard, own
   *  collections). Switches the preview's header from a byline to the
   *  creator's own view — see PreviewBody. */
  viewerIsOwner?: boolean;
  /** Credits each generation's creator on the tile — the public feed and
   *  shared collections. */
  showAuthor?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddToCollection?: (id: string) => void;
  onRemoveFromCollection?: (id: string) => void;
  onTogglePublic?: (id: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openItem = openIndex === null ? null : items[openIndex];
  const { toast } = useToast();
  // Liking writes to the server, so it needs an account. `me` fails (and
  // stays undefined) for a signed-out visitor on the public feed.
  const { data: me } = useMe();
  const toggleLike = useToggleLike();

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <GenerationCard
            key={item.id}
            item={item}
            onOpen={() => setOpenIndex(i)}
            showAuthor={showAuthor}
            onToggleLike={() =>
              me
                ? toggleLike.mutate({ item })
                : toast({
                    title: "Sign in to like",
                    description: "Likes are saved to your account.",
                  })
            }
          />
        ))}
      </div>
      <PreviewModal
        items={items}
        index={openIndex}
        author={author}
        viewerIsOwner={viewerIsOwner}
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
