"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/landing/ui/AnimatedCounter";
import { clubStats } from "@/lib/constants";
import { useTranslations } from "next-intl";

export default function HeroStats() {
  const t = useTranslations("VideoScrubHero");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-wrap justify-center md:justify-start gap-8 pt-4 mt-1 border-t border-white/20"
    >
      {clubStats.map((stat) => {
        let key = "";
        if (stat.label === "Years of Cricket") key = "stat_years";
        else if (stat.label === "Players & Members") key = "stat_players";
        else if (stat.label === "Championships") key = "stat_championships";
        return (
        <div key={stat.label} className="flex flex-col items-center text-center md:items-start md:text-left">
          <span className="font-display text-3xl font-bold text-gradient-gold">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </span>
          <span className="text-xs font-medium text-white/70 uppercase tracking-wider mt-1">
            {key ? t(key) : stat.label}
          </span>
        </div>
        );
      })}
    </motion.div>
  );
}
