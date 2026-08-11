import SectionHeading from "@/components/landing/ui/SectionHeading";
import AnimatedCounter from "@/components/landing/ui/AnimatedCounter";
import { achievements } from "@/lib/constants";

export default function AchievementsSection() {
  return (
    <section id="achievements" className="relative min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16">
        <SectionHeading
          eyebrow="Club Legacy"
          title="Built on Achievement."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {achievements.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-2">
              <span className="font-display text-4xl md:text-5xl font-bold text-gradient-gold">
                <AnimatedCounter target={item.value} suffix={item.suffix} />
              </span>
              <span className="text-xs font-medium text-tertiary-fixed uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
