"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import HeroStats from "./HeroStats";
import { siteConfig } from "@/lib/constants";



export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-[150vh] flex flex-col pt-16 pb-16">
      {/* Remove CricketExperience wrapper */}
      
      <div className="w-full flex items-start mt-4 md:mt-6">
          <div className="w-full max-w-[1280px] mx-auto px-5 md:px-16">
            <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-5">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-xs font-semibold tracking-[0.25em] uppercase text-secondary-fixed"
              >
                {siteConfig.name}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="font-display text-5xl md:text-7xl leading-tight font-bold text-on-background tracking-tight"
              >
                Where Cricket
                <span className="block text-gradient-gold">Builds Champions.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                className="text-base md:text-lg text-on-surface-variant max-w-lg leading-relaxed"
              >
                {siteConfig.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex flex-wrap gap-4 mt-2"
              >
                <Button href="#join">Join The Club</Button>
                <Button href="#about" variant="secondary">
                  Explore The Club
                </Button>
              </motion.div>

              <HeroStats />
            </div>
          </div>
        </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { duration: 0.8, delay: 1 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-on-surface-variant"
        aria-hidden="true"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
}
