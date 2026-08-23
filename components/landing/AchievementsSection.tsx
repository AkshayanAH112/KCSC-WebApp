"use client";

import SectionHeading from "@/components/landing/ui/SectionHeading";
import AnimatedCounter from "@/components/landing/ui/AnimatedCounter";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import FadeInSection from "@/components/landing/ui/FadeInSection";
import { achievements } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function AchievementsSection() {
  const t = useTranslations("AchievementsSection");
  return (
    <FadeInSection id="achievements" className="relative overflow-hidden min-h-[120vh] flex flex-col justify-center py-24 md:py-32">
      <ParallaxDecor variant="maroon" />
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col md:flex-row gap-16 md:gap-24 items-center w-full">
        <div className="flex-1 w-full relative">
          <div className="absolute -inset-4 bg-primary/15 rounded-[2.5rem] -z-10 blur-xl" />
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            align="left"
          />
        </div>

        <div className="flex-1 w-full grid grid-cols-2 gap-8 md:gap-12">
          {achievements.map((stat) => {
            let key = "";
            if (stat.label === "Trophies Won") key = "trophies";
            else if (stat.label === "Years of Rivalry") key = "rivalry";
            else if (stat.label === "Years in A Division") key = "division";
            else if (stat.label === "Founding Members") key = "founding";

            return (
              <motion.div
                key={stat.label}
                className="card-luxury flex flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all duration-300 sm:p-6"
              >
                <span className="font-display text-4xl md:text-5xl font-extrabold text-gradient-gold">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-tertiary-container/80">
                  {key ? t(key) : stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </FadeInSection>
  );
}
