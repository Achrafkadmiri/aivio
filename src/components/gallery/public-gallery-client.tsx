"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { Spinner } from "@/components/ui/spinner";
import type { GalleryItem } from "@/components/gallery/generation-card";

function usePublicGenerations() {
  return useQuery({
    queryKey: ["generations-public"],
    queryFn: async (): Promise<GalleryItem[]> => {
      const res = await apiFetch("/api/generations/public");
      if (!res.ok) throw new Error("Failed to load gallery");
      const data = await res.json();
      return data.items;
    },
  });
}

export function PublicGalleryClient() {
  const { data: generations, isLoading } = usePublicGenerations();

  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-heading font-bold tracking-tight text-ink sm:text-display">
          Community <span className="text-gradient">gallery</span>
        </h1>
        <p className="mt-4 text-body text-muted">
          A public showcase of generations from the Vixerra community.
        </p>
      </div>
      <div className="mt-12">
        {isLoading || !generations ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : generations.length === 0 ? (
          <p className="text-center text-body-sm text-muted">
            Nothing shared publicly yet — check back soon.
          </p>
        ) : (
          <GalleryGrid items={generations} showAuthor />
        )}
      </div>
    </div>
  );
}
