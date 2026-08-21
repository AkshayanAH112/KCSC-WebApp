"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * One "card" in the homepage's wipe-up stack. The outer `h-[200vh]` wrapper is
 * what makes the inner sticky section releasable rather than staying glued to
 * the viewport forever — a bare `position: sticky` element only lets go once
 * its containing block runs out of room below it, so without this wrapper the
 * card would stay pinned over every section that follows it. The 200vh split
 * gives it a bounded slide-up-and-arrive phase, a held phase, then a
 * covered-and-released phase, each exactly one viewport tall.
 *
 * The opacity layered on top is a cross-fade, not just the z-index cover: it
 * ramps 0->1 while this card is sliding up into place (so it blends in rather
 * than popping in front of whatever's behind it), holds at 1, then ramps back
 * to 1->0 while the *next* card slides up to cover it.
 */
export default function StackedSection({
  id,
  zIndex,
  className,
  children,
  wrapperRef: externalRef,
}: {
  id?: string;
  zIndex: number;
  className?: string;
  children: React.ReactNode;
  // Pass this when the section also needs its own scroll-linked effect (e.g.
  // FinalCTA's background parallax) — tracking the same wrapper, rather than
  // the sticky inner element (whose rect stops changing while it's pinned),
  // keeps that effect running smoothly across the card's whole visit.
  wrapperRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = externalRef ?? internalRef;

  // Arrival: from "this card's top is at the bottom of the viewport" (about to
  // slide into view) to "this card's top reaches the viewport top" (arrived).
  const { scrollYProgress: arrive } = useScroll({ target: ref, offset: ["start end", "start start"] });
  // Departure: from "this card's bottom is at the viewport bottom" (the next
  // card is about to start covering it) to "this card's bottom reaches the
  // viewport top" (fully released).
  const { scrollYProgress: depart } = useScroll({ target: ref, offset: ["end end", "end start"] });

  const arriveOpacity = useTransform(arrive, [0, 1], [0, 1]);
  const departOpacity = useTransform(depart, [0, 1], [1, 0]);
  // Each of the two above is clamped at 1 (arrive) or 1 (depart) outside its
  // own window, so the smaller of the two is 0->1 during arrival, 1 while
  // held, and 1->0 during departure.
  const opacity = useTransform([arriveOpacity, departOpacity], (values: number[]) => Math.min(...values));

  return (
    <div ref={ref} className="relative h-[200vh]">
      <motion.section
        id={id}
        style={{ opacity, zIndex }}
        className={cn("sticky top-0 h-screen overflow-hidden flex flex-col justify-center", className)}
      >
        {children}
      </motion.section>
    </div>
  );
}
