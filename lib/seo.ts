import { siteConfig } from "@/lib/constants";

// Keep in sync with messages/*.json and proxy.ts's next-intl locales list.
export const LOCALES = ["en", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * hreflang alternates + a self-referencing canonical for a given
 * locale-agnostic marketing path (e.g. "" for the homepage, "/about",
 * "/news/some-slug"). `locale` is the current page's own locale — without an
 * explicit canonical here, Google has no declared preference between /en and
 * /ta (or any other near-duplicate) and picks one on its own, which is what
 * "Duplicate without user-selected canonical" in Search Console means.
 */
export function localeAlternates(path: string, locale: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
  };
}

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

// The site-wide fallback OG/Twitter image — used by any page that sets its
// own `openGraph`/`twitter` (which fully replaces the layout's, not merges
// with it) but has no more specific image of its own (a post cover, a gallery
// album cover, etc).
export const DEFAULT_OG_IMAGE = { url: "/hero/hero-poster.jpg", width: 1920, height: 1080 };

/** BreadcrumbList JSON-LD for a page — pass its trail as `{ name, path }` from
 * the homepage down to (and including) the current page. */
export function breadcrumbJsonLd(locale: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(`/${locale}${item.path}`),
    })),
  };
}
