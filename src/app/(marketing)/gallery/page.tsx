import type { Metadata } from "next";
import { PublicGalleryClient } from "@/components/gallery/public-gallery-client";

export const metadata: Metadata = { title: "Gallery" };

export default function PublicGalleryPage() {
  return <PublicGalleryClient />;
}
