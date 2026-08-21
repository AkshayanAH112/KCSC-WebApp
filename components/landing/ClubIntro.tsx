import SectionHeading from "@/components/landing/ui/SectionHeading";
import { useTranslations } from "next-intl";

export default function ClubIntro() {
  const t = useTranslations("ClubIntro");
  return (
    <section id="about" className="relative min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          accent={t("accent")}
          description={t("description")}
        />
        <div className="grid grid-cols-2 gap-6">
          {[
            { key: "community" },
            { key: "development" },
            { key: "discipline" },
            { key: "competition" },
          ].map((item) => (
            <div key={item.key} className="card-surface shadow-soft rounded-2xl p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
                {t(`${item.key}_label`)}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t(`${item.key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
