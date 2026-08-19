import type { Metadata } from "next";
import { Suspense } from "react";
import { GenerateStudio } from "@/components/generate/generate-workspace";

export const metadata: Metadata = { title: "Animate an Image" };

export default function ImageToVideoPage() {
  return (
    <Suspense fallback={null}>
      <GenerateStudio type="image-to-video" />
    </Suspense>
  );
}
