import { siteConfig } from "@/lib/constants";

// Keep in sync with messages/*.json and proxy.ts's next-intl locales list.
export const LOCALES = ["en", "ta"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * hreflang alternates for a given locale-agnostic marketing path (e.g. "" for
 * the homepage, "/about", "/news/some-slug"). Returned as relative paths —
 * resolved against the root layout's `metadataBase` into absolute URLs.
 */
export function localeAlternates(path: string) {
  return {
    languages: Object.fromEntries(LOCALES.map((locale) => [locale, `/${locale}${path}`])),
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
