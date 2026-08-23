import { Sprout, Shield, GraduationCap } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import GlassCard from "@/components/landing/ui/GlassCard";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import FadeInSection from "@/components/landing/ui/FadeInSection";
import { programs } from "@/lib/constants";
import { useTranslations } from "next-intl";

const icons = { sprout: Sprout, shield: Shield, cap: GraduationCap };

export default function ProgramsSection() {
  const t = useTranslations("ProgramsSection");
  return (
    <FadeInSection id="programs" className="relative overflow-hidden min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <ParallaxDecor variant="gold" />
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 w-full">
        <div className="mb-16">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} align="center" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {programs.map((program, index) => {
            const Icon = icons[program.icon as keyof typeof icons];

            let key = "";
            if (program.title === "Junior Cricket & Coaching") key = "coaching";
            else if (program.title === "Competitive & League Cricket") key = "league";
            else if (program.title === "Free Educational Support") key = "education";

            return (
              <GlassCard key={program.title} className="group p-6 sm:p-7 flex flex-col gap-4">
                {/* Icon tile left, ghosted ordinal right. The number is
                    decorative sequencing, not content — hidden from the
                    accessibility tree so it isn't read before each title. */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-tertiary-container/30 bg-primary-container/50 text-tertiary-container">
                    <Icon size={20} />
                  </div>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-extrabold text-on-surface-variant/30 transition-colors group-hover:text-tertiary-container/60 sm:text-4xl"
                  >
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-on-primary transition-colors group-hover:text-on-primary-container">
                  {key ? t(`${key}_title`) : program.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{key ? t(`${key}_desc`) : program.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </FadeInSection>
  );
}
