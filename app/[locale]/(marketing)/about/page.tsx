import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/landing/about/AboutSection";
import Footer from "@/components/landing/layout/Footer";

const SECTION_KEYS = [
  "journey",
  "achievements",
  "battleEverest",
  "league",
  "community",
  "annualDay",
  "dengue",
  "freeEducation",
  "vision",
] as const;

export async function generateMetadata() {
  const t = await getTranslations("AboutPage");
  return {
    title: `${t("title")} ${t("accent")} | KCSC`,
    description: t("description"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <>
      <div className="min-h-screen bg-surface-container-lowest pt-24 pb-24">
        <header className="mx-auto mb-16 max-w-[1280px] px-5 md:px-16">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-on-surface-variant uppercase md:text-sm">
            <Link href="/" className="transition-colors hover:text-primary">
              {t("home")}
            </Link>
            <ChevronRight size={14} />
            <span className="text-primary">{t("about")}</span>
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                <span className="h-0.5 w-6 bg-primary"></span>
                {t("eyebrow")}
              </div>
              <h1 className="font-display text-4xl leading-tight font-bold tracking-tight text-on-surface md:text-6xl">
                {t("title")} <span className="text-primary">{t("accent")}</span>
              </h1>
            </div>
            <p className="max-w-md pb-2 text-base text-on-surface-variant md:text-right">
              {t("description")}
            </p>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1280px] flex-col gap-20 px-5 md:gap-28 md:px-16">
          {SECTION_KEYS.map((key, i) => (
            <AboutSection
              key={key}
              eyebrow={t(`${key}_eyebrow`)}
              title={t(`${key}_title`)}
              body={t(`${key}_body`)}
              reverse={i % 2 === 1}
              imagePlaceholderLabel={t("image_placeholder")}
            />
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-[1280px] px-5 text-center md:mt-28 md:px-16">
          <p className="font-display text-2xl font-bold tracking-tight text-on-background md:text-4xl">
            {t("closing")}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
