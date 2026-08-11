import { Sprout, Target, Shield } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { programs } from "@/lib/constants";

const icons = { sprout: Sprout, target: Target, shield: Shield };

export default function ProgramsSection() {
  return (
    <section id="programs" className="relative min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16">
        <div className="flex items-center justify-between mb-16">
          <SectionHeading eyebrow="Programs" title="Cricket Programs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((program) => {
            const Icon = icons[program.icon as keyof typeof icons];
            return (
              <GlassCard key={program.title} className="p-8 flex flex-col gap-4 hover:shadow-elevated transition-shadow duration-300">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-fixed to-primary-container flex items-center justify-center text-on-primary shadow-soft">
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-on-background">{program.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{program.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
