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
    // Next's image optimizer is turned OFF on purpose — do not flip this back
    // without reading the rest of this comment.
    //
    // Every image this app serves is already optimized before it is ever
    // stored: uploadImage() in lib/spaces.ts resizes to fit a 1600px box, bakes
    // in EXIF rotation, and re-encodes to WebP/JPEG at quality 82. Routing that
    // through /_next/image afterwards re-compresses an already-compressed file
    // — no meaningful size win, and on Vercel every (image, width, quality)
    // combination is billed as a separate "transformation".
    //
    // The Hobby plan includes 5,000 transformations/month. A single gallery
    // upload batch (100+ photos, each rendered at several widths, then again at
    // a different quality in the lightbox) exhausted that, and /_next/image
    // started returning 402 Payment Required — every image on the public site
    // broke at once. Serving straight from Spaces has no such cliff.
    //
    // Trade-off accepted: no automatic WebP conversion for formats that arrive
    // as something else, and no responsive srcset, so phones download the same
    // file as desktops. That is bounded because the stored file is already
    // capped at 1600px/q82. Set DO_SPACES_CDN_ENDPOINT so these are served from
    // the Spaces edge CDN rather than the bucket origin.
    unoptimized: true,
    // Inert while unoptimized is true; kept so re-enabling the optimizer does
    // not silently restore Next's default ladder (which runs to 3840 and can
    // only ever request widths larger than lib/spaces.ts's 1600px source).
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
