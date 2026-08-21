"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * A soft, brand-colored glow that drifts vertically at a different rate than
 * the page scroll as its section passes through the viewport — the same
 * "layers move at different speeds" parallax read the hero's video gives,
 * applied to sections that have no imagery of their own to shift instead.
 * Purely decorative: absolutely positioned behind the section's content,
 * which needs `relative` on its own `<section>` for the stacking to work.
 */
export default function ParallaxDecor({ variant = "gold" }: { variant?: "gold" | "maroon" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const yB = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  const color = variant === "gold" ? "bg-tertiary-container" : "bg-primary";

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ y: yA }}
        className={`absolute -right-24 -top-24 h-72 w-72 md:h-96 md:w-96 rounded-full ${color} opacity-[0.08] blur-3xl`}
      />
      <motion.div
        style={{ y: yB }}
        className={`absolute -left-16 bottom-0 h-64 w-64 md:h-80 md:w-80 rounded-full ${color} opacity-[0.06] blur-3xl`}
      />
    </div>
  );
}
