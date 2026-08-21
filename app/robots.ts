import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin console and its API are auth-gated already, but keeping
      // crawlers out entirely avoids wasted crawl budget on pages that would
      // 401/redirect to /login for them anyway.
      disallow: ["/admin", "/api", "/login"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
