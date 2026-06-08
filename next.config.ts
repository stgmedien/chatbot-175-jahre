import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bilder liegen später in Vercel Blob (Phase 2).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
