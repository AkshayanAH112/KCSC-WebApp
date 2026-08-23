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
      className="mt-4 grid grid-cols-3 divide-x divide-tertiary-container/20 rounded-2xl border border-tertiary-container/25 bg-linear-to-r from-surface-container/70 via-surface-bright/85 to-surface-container/70 p-4 backdrop-blur-md shadow-elevated sm:rounded-3xl sm:p-6"
    >
      {clubStats.map((stat) => {
        let key = "";
        if (stat.label === "Years of Cricket") key = "stat_years";
        else if (stat.label === "Players & Members") key = "stat_players";
        else if (stat.label === "Championships") key = "stat_championships";
        return (
        <div key={stat.label} className="flex flex-col items-center gap-1 px-2 text-center sm:px-6">
          <span className="font-display text-2xl font-extrabold tracking-tight text-on-primary sm:text-4xl md:text-5xl">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary-container/80 sm:text-xs">
            {key ? t(key) : stat.label}
          </span>
        </div>
        );
      })}
    </motion.div>
  );
}
