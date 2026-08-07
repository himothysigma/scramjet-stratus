import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // NO standalone output — that's a Vercel setting that makes Replit detect it as Vercel
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "media.giphy.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { source: "/games/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      { source: "/uv/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      { source: "/api/uploads/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/api/voice/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ]
  },
}

export default nextConfig
