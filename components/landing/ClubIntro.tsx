import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import StackedSection from "@/components/landing/ui/StackedSection";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export default function ClubIntro() {
  const t = useTranslations("ClubIntro");
  const locale = useLocale();
  return (
    <StackedSection id="about" zIndex={10} className="bg-background py-24 md:py-32">
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
            [
              { key: "founded", dark: false },
              { key: "countries", dark: true },
            ],
            [
              { key: "members", dark: true },
              { key: "division", dark: false },
            ],
          ].map((column, col) => (
            // Staggered "brick" layout: the whole left column sits higher, the
            // whole right column sits lower (and nudged right) instead of a
            // flat 2x2 grid — offsetting the column wrapper, not each card,
            // keeps the gap between the two stacked cards in it consistent.
            <div key={col} className={cn("flex flex-col gap-6", col === 0 ? "-mt-6" : "mt-6 md:ml-3")}>
              {column.map((item, row) => {
                const i = col + row * 2;
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "animate-card-float rounded-2xl p-6 shadow-elevated",
                      item.dark ? "bg-on-background" : "bg-primary"
                    )}
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    <p className="font-display text-3xl font-bold text-gradient-gold mb-1">{t(`${item.key}_value`)}</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                      {t(`${item.key}_label`)}
                    </h3>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </StackedSection>
  );
}
