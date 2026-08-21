"use client";

import SectionHeading from "@/components/landing/ui/SectionHeading";
import AnimatedCounter from "@/components/landing/ui/AnimatedCounter";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import { achievements } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function AchievementsSection() {
  const t = useTranslations("AchievementsSection");
  return (
    <section id="achievements" className="relative overflow-hidden min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <ParallaxDecor variant="maroon" />
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col md:flex-row gap-16 md:gap-24 items-center w-full">
        <div className="flex-1 w-full relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] -z-10 blur-xl" />
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            align="left"
          />
        </div>

        <div className="flex-1 w-full grid grid-cols-2 gap-8 md:gap-12">
          {achievements.map((stat) => {
            let key = "";
            if (stat.label === "Championships") key = "championships";
            else if (stat.label === "Players Developed") key = "players";
            else if (stat.label === "Active Teams") key = "teams";
            else if (stat.label === "Years of Legacy") key = "years";

            return (
              <motion.div key={stat.label} className="flex flex-col items-center text-center gap-2">
                <span className="font-display text-4xl md:text-5xl font-bold text-gradient-gold">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mt-2">
                  {key ? t(key) : stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
