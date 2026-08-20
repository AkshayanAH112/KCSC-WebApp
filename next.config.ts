import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow other devices on the LAN (phone testing the dev server) to load
  // Next.js dev resources like HMR. Dev-only setting; ignored in production.
  allowedDevOrigins: ["192.168.1.17"],
  // News/blog images are served from Cloudinary (see lib/cloudinary.ts).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // CORS for the mobile app (../Mobileapp, Capacitor). It authenticates with an
  // Authorization: Bearer header — no cookies — so a wildcard origin is safe.
  // Static headers (not proxy.ts) because Vercel answers OPTIONS preflights at the
  // routing layer, before proxy/middleware runs; headers() applies at that layer.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
