import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import { useTranslations, useLocale } from "next-intl";

export default function ClubIntro() {
  const t = useTranslations("ClubIntro");
  const locale = useLocale();
  return (
    <section id="about" className="relative overflow-hidden min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <ParallaxDecor variant="maroon" />
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            accent={t("accent")}
            description={t("description")}
          />
          <Link
            href={`/${locale}/about`}
            className="group inline-flex w-fit items-center gap-2 font-semibold text-primary transition-colors hover:text-on-surface"
          >
            {t("read_story")}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[
            { key: "founded" },
            { key: "members" },
            { key: "countries" },
            { key: "division" },
          ].map((item) => (
            <div key={item.key} className="card-surface shadow-soft rounded-2xl p-6">
              <p className="font-display text-3xl font-bold text-gradient-gold mb-1">{t(`${item.key}_value`)}</p>
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                {t(`${item.key}_label`)}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
