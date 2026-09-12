import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Footer from "@/components/landing/layout/Footer";
import { localeAlternates, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";

// Bump this whenever the policy text in messages/*.json actually changes —
// AdSense review and returning readers both look at it, and a date that never
// moves is worse than no date.
const LAST_UPDATED = "2026-09-12";

type Item = { label?: string; text: string };
type OutboundLink = { label: string; href: string };
type Section = {
  title: string;
  paragraphs?: string[];
  items?: Item[];
  links?: OutboundLink[];
  footnote?: string;
};

const title = "Privacy Policy | KCSC";
const description =
  "How Kallar Central Sports Club collects, uses and shares personal information on kallarcentralsc.com, including cookies and advertising.";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title,
    description,
    alternates: localeAlternates("/privacy", locale),
    openGraph: { title, description, type: "website" as const, images: [DEFAULT_OG_IMAGE] },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations("PrivacyPage");
  const isTamil = locale === "ta";

  // Sections are an array in the message files so both locales stay in the same
  // order by construction — t() cannot read arrays, hence t.raw().
  const sections = t.raw("sections") as Section[];

  const updated = new Date(LAST_UPDATED).toLocaleDateString(isTamil ? "ta-LK" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = breadcrumbJsonLd(locale, [
    { name: t("home"), path: "" },
    { name: t("privacy"), path: "/privacy" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-surface-container-lowest pt-24 pb-24">
        <div className="mx-auto max-w-[820px] px-5 md:px-16">
          <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant md:text-sm">
            <Link href={`/${locale}`} className="transition-colors hover:text-tertiary-container">
              {t("home")}
            </Link>
            <ChevronRight size={14} />
            <span className="text-tertiary-container">{t("privacy")}</span>
          </div>

          <header className="mb-10">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.2em] text-tertiary-container">
              {t("eyebrow")}
            </span>
            <h1
              className={`font-display font-extrabold leading-tight tracking-tight wrap-break-word text-on-primary-container ${
                isTamil ? "text-2xl sm:text-3xl md:text-4xl" : "text-4xl md:text-5xl"
              }`}
            >
              {t("title")}
              <span className="block text-gradient-gold">{t("accent")}</span>
            </h1>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
              {t("updated", { date: updated })}
            </p>
            <p className="mt-5 text-base leading-relaxed text-on-surface-variant">{t("lead")}</p>
          </header>

          <div className="flex flex-col gap-10">
            {sections.map((section, index) => (
              <section key={section.title} className="flex flex-col gap-3">
                <h2
                  className={`font-display font-bold text-on-primary-container ${
                    isTamil ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                  }`}
                >
                  <span className="mr-2 tabular-nums text-tertiary-container/60">{index + 1}.</span>
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}

                {section.items && (
                  <ul className="flex flex-col gap-2.5">
                    {section.items.map((item) => (
                      <li
                        key={item.text}
                        className="flex gap-3 text-sm leading-relaxed text-on-surface-variant"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tertiary-container"
                        />
                        <span>
                          {item.label && (
                            <strong className="font-bold text-on-primary-container">
                              {item.label}{" "}
                            </strong>
                          )}
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.links && (
                  <ul className="mt-1 flex flex-col gap-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-tertiary-fixed underline decoration-tertiary-container/40 underline-offset-4 transition-colors hover:text-on-primary-container hover:decoration-tertiary-container"
                        >
                          {link.label}
                          <ExternalLink size={13} className="shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {section.footnote && (
                  <p className="mt-1 rounded-xl border border-tertiary-container/15 bg-surface-container/30 p-3.5 text-xs leading-relaxed text-on-surface-variant">
                    {section.footnote}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
