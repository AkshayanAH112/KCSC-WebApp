"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/landing/ui/AnimatedCounter";
import { clubStats } from "@/lib/constants";
import { useTranslations } from "next-intl";

export default function HeroStats() {
  const t = useTranslations("VideoScrubHero");
  // Frosted glass, not a card: no outline, a see-through tint, and a heavy
  // blur to carry the effect. shadow-soft rather than shadow-elevated on
  // purpose — shadow-elevated layers a 1px gold ring, which would still draw
  // an edge once the border class is gone.
  //
  // The tint bottoms out at ~55%: the bat and ball behind the bar's right half
  // are bright wood, and measured against that backdrop a lighter tint drops
  // the gold labels to 1.8:1. At 55% they hold ~3.7:1, past AA for large text,
  // while the footage still reads clearly through the glass.
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="mt-4 grid grid-cols-3 divide-x divide-tertiary-container/15 rounded-2xl bg-linear-to-r from-surface-container/55 via-surface-bright/60 to-surface-container/55 p-4 backdrop-blur-xl shadow-soft sm:rounded-3xl sm:p-6"
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary-container sm:text-xs">
            {key ? t(key) : stat.label}
          </span>
        </div>
        );
      })}
    </motion.div>
  );
}
