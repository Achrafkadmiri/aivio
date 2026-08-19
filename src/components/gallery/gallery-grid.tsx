"use client";

import { useState } from "react";
import { GenerationCard, type GalleryItem } from "./generation-card";
import { Lightbox } from "./lightbox";

export function GalleryGrid({
  items,
  onDelete,
  onDuplicate,
  onAddToCollection,
  onRemoveFromCollection,
  onTogglePublic,
}: {
  items: GalleryItem[];
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddToCollection?: (id: string) => void;
  onRemoveFromCollection?: (id: string) => void;
  onTogglePublic?: (id: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <GenerationCard
            key={item.id}
            item={item}
            onOpen={() => setOpenIndex(i)}
            onDelete={onDelete ? () => onDelete(item.id) : undefined}
            onDuplicate={onDuplicate ? () => onDuplicate(item.id) : undefined}
            onAddToCollection={onAddToCollection ? () => onAddToCollection(item.id) : undefined}
            onRemoveFromCollection={
              onRemoveFromCollection ? () => onRemoveFromCollection(item.id) : undefined
            }
            onTogglePublic={onTogglePublic ? () => onTogglePublic(item.id) : undefined}
          />
        ))}
      </div>
      <Lightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
