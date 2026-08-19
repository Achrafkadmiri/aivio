"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { useToast } from "@/components/ui/toast";
import type { GalleryItem } from "@/components/gallery/generation-card";
import { apiFetch } from "@/lib/api-client";

type CollectionDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  shareToken: string;
  items: GalleryItem[];
};

export function CollectionDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collection, isLoading, isError, error } = useQuery({
    queryKey: ["collection", id],
    queryFn: async (): Promise<CollectionDetail> => {
      const res = await apiFetch(`/api/collections/${id}`);
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok) throw new Error("Failed to load collection");
      return res.json();
    },
  });

  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (collection && !seeded) {
      setName(collection.name);
      setIsPublic(collection.isPublic);
      setSeeded(true);
    }
  }, [collection, seeded]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["collection", id] });
  }

  async function save(partial: Partial<{ name: string; isPublic: boolean }>) {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new Error("Failed to save");
      invalidate();
    } catch {
      toast({ title: "Couldn't save changes", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(generationId: string) {
    await apiFetch(`/api/collections/${id}/items/${generationId}`, { method: "DELETE" });
    invalidate();
  }

  async function deleteCollection() {
    if (!confirm("Delete this collection? Generations inside it won't be deleted.")) return;
    await apiFetch(`/api/collections/${id}`, { method: "DELETE" });
    router.push("/collections");
  }

  if (isLoading || !collection) {
    if (isError && error instanceof Error && error.message === "not-found") {
      return (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-body text-ink-soft">Collection not found</p>
          <p className="text-body-sm text-muted">
            It may have been deleted, or you don&apos;t have access to it.
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/c/${collection.shareToken}` : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== collection.name && save({ name })}
            className="w-full rounded-lg bg-transparent text-heading font-bold tracking-tight text-ink outline-none focus:bg-white/5"
          />
          {collection.description && (
            <p className="mt-2 text-body-sm text-muted">{collection.description}</p>
          )}
        </div>
        <Button variant="secondary" onClick={deleteCollection}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <Card
        variant="compact"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => {
              setIsPublic(checked);
              save({ isPublic: checked });
            }}
            disabled={saving}
          />
          <div>
            <p className="text-label text-ink-soft">Public share link</p>
            <p className="text-caption text-muted">Anyone with the link can view this collection.</p>
          </div>
        </div>
        {isPublic && (
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} className="sm:w-72" />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "Link copied", variant: "success" });
              }}
              aria-label="Copy link"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        )}
      </Card>

      {collection.items.length === 0 ? (
        <p className="py-16 text-center text-body-sm text-muted">
          No items in this collection yet. Add some from your gallery.
        </p>
      ) : (
        <GalleryGrid items={collection.items} onRemoveFromCollection={removeItem} />
      )}
    </div>
  );
}
