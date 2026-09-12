import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import ResultsLookup from "@/components/landing/ResultsLookup";
import Footer from "@/components/landing/layout/Footer";
import { localeAlternates, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";

// No DB read at render — the page is a static shell and every lookup happens
// client-side against POST /api/public/results, so unlike /news and /gallery
// this one has no reason to opt out of prerendering.

const title = "Exam Results | KCSC";
const description =
  "Look up published exam results for a student in the Kallar Central Sports Club free tuition programme using the registration number on their student card.";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title,
    description,
    alternates: localeAlternates("/results", locale),
    openGraph: { title, description, type: "website" as const, images: [DEFAULT_OG_IMAGE] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export default async function ResultsPage() {
  const locale = await getLocale();
  const t = await getTranslations("ResultsPage");
  const isTamil = locale === "ta";

  const jsonLd = breadcrumbJsonLd(locale, [
    { name: t("home"), path: "" },
    { name: t("results"), path: "/results" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-surface-container-lowest pt-24 pb-24">
        <div className="mx-auto max-w-[900px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant md:text-sm">
            <Link href={`/${locale}`} className="transition-colors hover:text-tertiary-container">
              {t("home")}
            </Link>
            <ChevronRight size={14} />
            <span className="text-tertiary-container">{t("results")}</span>
          </div>

          <header className="mb-10">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.2em] text-tertiary-container">
              {t("eyebrow")}
            </span>
            {/* Tamil drops a size step for the same reason SectionHeading does:
                its compounds are single unbreakable words that overflow at the
                Latin heading size. */}
            <h1
              className={`font-display font-extrabold leading-tight tracking-tight wrap-break-word text-on-primary-container ${
                isTamil ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl md:text-5xl"
              }`}
            >
              {t("title")}
              <span className="block text-gradient-gold">{t("accent")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">
              {t("description")}
            </p>
          </header>

          <ResultsLookup />
        </div>
      </div>

      <Footer />
    </>
  );
}
