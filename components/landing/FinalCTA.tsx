"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/landing/ui/Button";
import StackedSection from "@/components/landing/ui/StackedSection";
import { useTranslations } from "next-intl";

export default function FinalCTA() {
  // Tracks the outer wrapper (not the sticky inner section, whose rect stops
  // changing while pinned), so this parallax keeps animating smoothly across
  // the card's whole visit instead of freezing during the held phase.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start end", "end start"] });
  // The photo overscans its box (h-[130%]) so this shift never reveals empty edges.
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const t = useTranslations("FinalCTA");

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-join-modal"));
  };

  return (
    <StackedSection
      id="join"
      zIndex={60}
      wrapperRef={wrapperRef}
      className="bg-surface-container-lowest pt-32 pb-12 md:pt-48 md:pb-16"
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src="/sections/finalcta-bg.jpg"
          alt=""
          aria-hidden="true"
          style={{ y }}
          className="absolute -top-[15%] left-0 h-[130%] w-full object-cover"
        />
        {/* Base darken, so the photo never sits raw behind the page. */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Centered radial scrim, so the CTA text stays legible regardless of
            what the photo is doing directly behind it. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(5,5,10,.72) 0%, rgba(5,5,10,.42) 55%, rgba(5,5,10,0) 85%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col items-center text-center gap-6">
        <h2
          className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight"
          style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78), 0 10px 44px rgba(5,5,10,.8)" }}
        >
          {t("title")}
        </h2>

        <p
          className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-snug"
          style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78)" }}
        >
          {t("description")}
        </p>

        <Button
          size="lg"
          className="bg-primary text-on-primary hover:bg-primary-hover shadow-elevated"
          onClick={handleJoinClick}
        >
          {t("join")}
        </Button>
      </div>
    </StackedSection>
  );
}
