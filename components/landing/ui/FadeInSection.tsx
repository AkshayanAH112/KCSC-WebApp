"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Plain scroll-triggered fade-in — no sticky/pinning, just a reveal as the
 * section enters the viewport. Reverted from an earlier wipe-up sticky-card
 * stack experiment back to this simpler effect.
 */
const FadeInSection = forwardRef<HTMLElement, HTMLMotionProps<"section">>(function FadeInSection(
  { children, ...props },
  ref
) {
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.section>
  );
});

export default FadeInSection;
