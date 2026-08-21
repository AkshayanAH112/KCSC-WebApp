import { Sprout, Shield, GraduationCap } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import GlassCard from "@/components/landing/ui/GlassCard";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import { programs } from "@/lib/constants";
import { useTranslations } from "next-intl";

const icons = { sprout: Sprout, shield: Shield, cap: GraduationCap };

export default function ProgramsSection() {
  const t = useTranslations("ProgramsSection");
  return (
    // The extra-tall wrapper (2x viewport) is what gives the sticky card its
    // "hold" duration and, critically, a bounded release point — a bare sticky
    // section with no wrapper has nothing to stop it sticking indefinitely
    // (it releases only once its containing block runs out of room below it,
    // which without this wrapper would be the entire rest of the homepage).
    <div className="relative h-[200vh]">
      <section
        id="programs"
        className="sticky top-0 z-10 h-screen overflow-hidden bg-surface flex flex-col justify-center py-24 md:py-32 shadow-elevated"
      >
        <ParallaxDecor variant="gold" />
        <div className="max-w-[1280px] mx-auto px-5 md:px-16 w-full">
          <div className="flex items-center justify-between mb-16">
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((program) => {
              const Icon = icons[program.icon as keyof typeof icons];

              let key = "";
              if (program.title === "Junior Cricket & Coaching") key = "coaching";
              else if (program.title === "Competitive & League Cricket") key = "league";
              else if (program.title === "Free Educational Support") key = "education";

              return (
                <GlassCard key={program.title} className="p-8 flex flex-col gap-4 hover:shadow-elevated transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-fixed to-primary-container flex items-center justify-center text-on-primary shadow-soft">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-on-background">{key ? t(`${key}_title`) : program.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{key ? t(`${key}_desc`) : program.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
