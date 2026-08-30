import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Allow other devices on the LAN (phone testing the dev server) to load
  // Next.js dev resources like HMR. Dev-only setting; ignored in production.
  allowedDevOrigins: ["192.168.1.17"],
  // sharp's actual dependency is a native shared library (libvips-cpp.so),
  // loaded at runtime via dlopen rather than a plain require() — Next's file
  // tracer doesn't follow that and leaves it out of the deployed serverless
  // function by default, which is what broke image uploads in production
  // (ERR_DLOPEN_FAILED). This is Next's own documented fix for exactly this
  // — but it only takes effect under webpack; Turbopack's production-build
  // tracer doesn't honor it yet, hence `next build --webpack` in package.json.
  outputFileTracingIncludes: {
    "/api/upload": ["./node_modules/sharp/**/*"],
  },
  // News/blog images are served from DigitalOcean Spaces (see lib/spaces.ts).
  // res.cloudinary.com stays for posts/members/gallery entries created before
  // the migration — their stored URLs still point there.
  images: {
    // Capped at 1600 to match MAX_DIMENSION in lib/spaces.ts: every stored image
    // is resized to fit a 1600px box at upload, so Next's default ladder (which
    // runs to 3840) can only ever request variants larger than the source. Next
    // won't upscale, but each of those widths is still billed as its own
    // transformation on Vercel — and the Hobby plan includes 5,000/month.
    // Keep this in sync if MAX_DIMENSION ever changes.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.digitaloceanspaces.com" },
      { protocol: "https", hostname: "*.cdn.digitaloceanspaces.com" },
    ],
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

export default withNextIntl(nextConfig);
