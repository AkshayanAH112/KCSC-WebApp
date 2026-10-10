import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Footer from "@/components/landing/layout/Footer";
import { breadcrumbJsonLd, localeAlternates, DEFAULT_OG_IMAGE } from "@/lib/seo";

/**
 * Frame shared by every /live page: breadcrumb, container, footer. The pages
 * themselves are thin — the content is a client component that polls the
 * public cricket API, so nothing below the breadcrumb is rendered on the server.
 *
 * `current` is the last crumb when the page is deeper than /live (a match, a
 * team); omitted on /live itself.
 */
export default async function LivePageShell({
  path,
  current,
  children,
}: {
  path: string;
  current?: string | null;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Live");

  const jsonLd = breadcrumbJsonLd(locale, [
    { name: t("home"), path: "" },
    { name: t("live"), path: "/live" },
    ...(current ? [{ name: current, path }] : []),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-surface-container-lowest pt-24 pb-24">
        <div className="mx-auto max-w-[1000px] px-5 md:px-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant md:text-sm">
            <Link href={`/${locale}`} className="transition-colors hover:text-tertiary-container">
              {t("home")}
            </Link>
            <ChevronRight size={14} />
            {current ? (
              <>
                <Link href={`/${locale}/live`} className="transition-colors hover:text-tertiary-container">
                  {t("live")}
                </Link>
                <ChevronRight size={14} />
                <span className="min-w-0 truncate text-tertiary-container">{current}</span>
              </>
            ) : (
              <span className="text-tertiary-container">{t("live")}</span>
            )}
          </nav>

          {children}
        </div>
      </div>

      <Footer />
    </>
  );
}

/** Metadata for a /live page. A null `name` is something not public (or not found): generic title, kept out of the index. */
export async function liveMetadata(path: string, name?: string | null) {
  const locale = await getLocale();
  const t = await getTranslations("Live");
  const title = name ? `${name} | ${t("meta_title")}` : t("meta_title");
  const description = t("meta_description");
  return {
    title,
    description,
    alternates: localeAlternates(path, locale),
    ...(name === null ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, type: "website" as const, images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary_large_image" as const, title, description, images: [DEFAULT_OG_IMAGE.url] },
  };
}
