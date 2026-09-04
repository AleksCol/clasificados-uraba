import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las fotos de los avisos viven en Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
