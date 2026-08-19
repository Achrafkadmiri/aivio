import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "v3b.fal.media" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "4000" }, // backend dev, uploads
    ],
  },
};

export default nextConfig;
