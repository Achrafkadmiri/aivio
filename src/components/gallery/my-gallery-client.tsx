"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMe } from "@/hooks/use-me";
import { GalleryGrid } from "./gallery-grid";
import { AddToCollectionModal } from "./add-to-collection-modal";
import type { GalleryItem } from "./generation-card";
import { GENERATION_TYPES, GENERATION_STATUSES } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";

type GenerationsResponse = { items: GalleryItem[]; nextCursor: string | null; hasMore: boolean };

export function MyGalleryClient() {
  const { toast } = useToast();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [collectionTarget, setCollectionTarget] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  const filters = { type, status, search: debouncedSearch };

  const query = useInfiniteQuery({
    queryKey: ["generations", filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (pageParam) params.set("cursor", pageParam);
      const res = await apiFetch(`/api/generations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load generations");
      return (await res.json()) as GenerationsResponse;
    },
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["generations"] });
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/generations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Deleted", variant: "success" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/generations/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) throw new Error("Failed to duplicate");
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Duplicated", description: "Re-running with the same settings.", variant: "success" });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await apiFetch(`/api/generations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => invalidate(),
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-64">
          <SearchInput
            placeholder="Search by prompt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-44">
          <option value="">All types</option>
          {GENERATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/-/g, " ")}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
          <option value="">All statuses</option>
          {GENERATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-body-sm text-muted">No generations match these filters.</p>
        ) : (
          <>
            <GalleryGrid
              items={items}
              author={me ? { name: me.name, avatarUrl: me.avatarUrl } : undefined}
              onDelete={(id) => deleteMutation.mutate(id)}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onAddToCollection={(id) => setCollectionTarget(id)}
              onTogglePublic={(id) => {
                const item = items.find((i) => i.id === id);
                if (item) togglePublicMutation.mutate({ id, isPublic: !item.isPublic });
              }}
            />
            {query.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  loading={query.isFetchingNextPage}
                  onClick={() => query.fetchNextPage()}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <AddToCollectionModal generationId={collectionTarget} onClose={() => setCollectionTarget(null)} />
    </div>
  );
}
