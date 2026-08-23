import Link from "next/link";
import { ArrowRight, Flag, Users, Globe, Trophy } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import FadeInSection from "@/components/landing/ui/FadeInSection";
import { useTranslations, useLocale } from "next-intl";

// Each stat card is identified by its i18n key prefix — `${key}_value` and
// `${key}_label` already exist in messages/*.json, so the card grid adds an
// icon per stat without introducing any new copy.
const STATS = [
  { key: "founded", Icon: Flag },
  { key: "members", Icon: Users },
  { key: "countries", Icon: Globe },
  { key: "division", Icon: Trophy },
] as const;

export default function ClubIntro() {
  const t = useTranslations("ClubIntro");
  const locale = useLocale();
  return (
    <FadeInSection id="about" className="relative overflow-hidden min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
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
            className="group inline-flex w-fit items-center gap-2 font-bold text-tertiary-container transition-colors hover:text-on-primary"
          >
            {t("read_story")}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {STATS.map(({ key, Icon }) => (
            <div
              key={key}
              className="card-luxury group flex flex-col items-center justify-center gap-2 rounded-2xl p-5 text-center transition-all duration-300 sm:p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-tertiary-container/30 bg-primary-container/50 text-tertiary-container transition-transform group-hover:scale-110">
                <Icon size={20} />
              </div>
              <p className="font-display text-2xl font-extrabold text-on-primary sm:text-3xl">
                {t(`${key}_value`)}
              </p>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-tertiary-container/80 sm:text-xs">
                {t(`${key}_label`)}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}
