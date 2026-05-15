import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all static files in the public folder
        source: "/:path((?!_next/).*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2|woff|ttf))",
        headers: [
          {
            key: "Cache-Control",
            // 1 year immutable — browser will NEVER re-fetch until filename changes
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
