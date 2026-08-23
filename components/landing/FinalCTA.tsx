"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import Button from "@/components/landing/ui/Button";
import FadeInSection from "@/components/landing/ui/FadeInSection";
import { useTranslations } from "next-intl";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  // The photo overscans its box (h-[130%]) so this shift never reveals empty edges.
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const t = useTranslations("FinalCTA");

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-join-modal"));
  };

  return (
    <FadeInSection
      ref={sectionRef}
      id="join"
      className="relative flex flex-col justify-center py-16 md:py-24 overflow-hidden"
    >
      <div className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-16 w-full">
        {/* Inset banner rather than a full-bleed band: the section's own ground
            is already near-black, so a full-bleed treatment would have nothing
            to contrast against and the CTA would stop reading as a distinct
            invitation. */}
        <div className="relative overflow-hidden rounded-3xl border border-tertiary-container/35 shadow-elevated">
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/sections/finalcta-bg.jpg"
              alt=""
              aria-hidden="true"
              style={{ y }}
              className="absolute -top-[15%] left-0 h-[130%] w-full object-cover"
            />
            {/* Maroon gradient over the photo — it carries the design's banner
                color while the photo underneath supplies texture and the
                parallax shift. */}
            <div className="absolute inset-0 bg-linear-to-r from-[#2f0c11]/95 via-[#481219]/90 to-[#25090d]/95" />
            <div className="absolute top-0 right-0 h-full w-96 bg-radial from-tertiary-container/15 via-primary/10 to-transparent pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-tertiary-container/10 blur-2xl pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 p-8 text-center sm:p-12 md:flex-row md:justify-between md:text-left">
            {/* The existing copy already splits the way this design wants it:
                `title` is the short prompt ("Ready to take the field?") and
                `description` is the substantive line, so they map onto the
                eyebrow and the headline without inventing new strings. */}
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-tertiary-container md:justify-start">
                <Sparkles size={16} />
                <span>{t("title")}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-on-primary">
                {t("description")}
              </h2>
            </div>

            <div className="shrink-0">
              <Button size="lg" onClick={handleJoinClick}>
                {t("join")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FadeInSection>
  );
}
