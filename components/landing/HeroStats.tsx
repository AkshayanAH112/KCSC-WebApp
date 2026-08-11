"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { clubStats } from "@/lib/constants";

export default function HeroStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-wrap gap-8 pt-4 mt-1 border-t border-outline-variant"
    >
      {clubStats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <span className="font-display text-3xl font-bold text-gradient-gold">
            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          </span>
          <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
