import type { Metadata } from "next";
import { MarketingStudio } from "@/components/studio/marketing-studio";

export const metadata: Metadata = {
  title: "Marketing studio",
  description:
    "Ad-ready images and video from your own product and talent — pick a style, attach your assets, write a one-line brief.",
};

export default function MarketingStudioPage() {
  return <MarketingStudio />;
}
