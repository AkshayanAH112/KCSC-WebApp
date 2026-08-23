"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "@/components/landing/ui/Button";
import HeroStats from "./HeroStats";
import { siteConfig } from "@/lib/constants";
import { useTranslations, useLocale } from "next-intl";

const VIDEO_SRC = "/hero/hero-scrub.mp4";
const POSTER_SRC = "/hero/hero-poster.jpg";

// Visitors who get the static hero instead of the scrub. Re-evaluated live via
// matchMedia listeners, not just once at load, so a rotation/resize/preference
// flip during the session is honored immediately.
const GATES = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
];

export default function VideoScrubHero() {
  const t = useTranslations("VideoScrubHero");
  const locale = useLocale();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scrubEnabled, setScrubEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const rafId = useRef<number | null>(null);
  const target = useRef(0);
  const shown = useRef(0);
  const lastTick = useRef(0);
  const seekBusy = useRef(false);
  const pendingTime = useRef<number | null>(null);
  const heroOnScreen = useRef(false);
  const blobStarted = useRef(false);

  useEffect(() => {
    const mqls = GATES.map((q) => window.matchMedia(q));
    const apply = () => setScrubEnabled(!mqls.some((m) => m.matches));
    apply();
    mqls.forEach((m) => m.addEventListener("change", apply));
    return () => mqls.forEach((m) => m.removeEventListener("change", apply));
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      heroOnScreen.current = entry.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch the whole clip as a Blob (under 8MB) rather than streaming straight
  // from `src` — some hosts silently lack HTTP Range support, which clamps
  // every seek to zero and breaks scrubbing in production while working fine
  // locally.
  useEffect(() => {
    if (!scrubEnabled || blobStarted.current) return;
    blobStarted.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(VIDEO_SRC);
        const blob = await res.blob();
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.src = URL.createObjectURL(blob);
        video.load();
        video.addEventListener("canplay", () => setVideoReady(true), { once: true });
      } catch {
        if (!cancelled) setVideoFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scrubEnabled]);

  const requestSeek = (t: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    // A seek to (near) the video's current time never fires `seeked` in most
    // browsers, which would otherwise leave the busy gate stuck forever.
    if (Math.abs(video.currentTime - t) < 0.01) return;
    if (seekBusy.current) {
      pendingTime.current = t;
      return;
    }
    seekBusy.current = true;
    video.currentTime = t;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onSeeked = () => {
      seekBusy.current = false;
      if (pendingTime.current !== null) {
        const t = pendingTime.current;
        pendingTime.current = null;
        requestSeek(t);
      }
    };
    const onError = () => {
      seekBusy.current = false;
      pendingTime.current = null;
      setVideoFailed(true);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    // The <video> element only exists once scrubEnabled flips true (it's
    // conditionally rendered), so this must re-run then — not just on mount,
    // when videoRef.current is still null and the listeners never attach.
  }, [scrubEnabled]);

  const heroProgress = () => {
    const el = heroRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    if (span <= 0) return 1;
    return Math.min(1, Math.max(0, -rect.top / span));
  };

  // The content drifts and fades at its own, linear rate as the hero
  // scrolls — independent of the video's own footage-driven motion behind
  // it, which is what actually reads as parallax depth rather than the
  // two layers just moving in lockstep.
  const applyParallax = (progress: number) => {
    const el = contentRef.current;
    if (!el) return;
    const fade = 1 - Math.min(1, Math.max(0, (progress - 0.6) / 0.4)) * 0.9;
    el.style.transform = `translateY(${progress * -60}px)`;
    el.style.opacity = String(fade);
  };

  useEffect(() => {
    if (!scrubEnabled || !videoReady) return;

    const tick = (now: number) => {
      const dt = Math.min(100, now - (lastTick.current || now));
      lastTick.current = now;
      const k = 0.16; // smoothing per 60fps frame, normalized below for other refresh rates
      shown.current += (target.current - shown.current) * (1 - Math.pow(1 - k, dt / 16.667));
      if (Math.abs(target.current - shown.current) < 0.0005) {
        shown.current = target.current;
        rafId.current = null;
        lastTick.current = 0;
      } else {
        rafId.current = requestAnimationFrame(tick);
      }
      const video = videoRef.current;
      if (video && video.duration) requestSeek(shown.current * video.duration);
      applyParallax(shown.current);
    };

    const onScroll = () => {
      target.current = heroProgress();
      if (rafId.current === null && heroOnScreen.current) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Land on the current scroll position immediately (e.g. a mid-page refresh).
    target.current = heroProgress();
    shown.current = target.current;
    if (videoRef.current?.duration) requestSeek(shown.current * videoRef.current.duration);
    applyParallax(shown.current);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubEnabled, videoReady]);

  const showStatic = !scrubEnabled || videoFailed;

  return (
    <div
      id="home"
      ref={heroRef}
      className="relative"
      style={{ height: showStatic ? "100vh" : "400vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background layer: scrub video, or the static composed frame for
            phones / portrait tablets / reduced motion / a video that failed
            to load. The page must be complete and beautiful either way. */}
        <div className="absolute inset-0 bg-background">
          {/* Poster paints first and stays underneath — the video fades in
              on top of it once ready, so there is never a blank frame. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_SRC}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {!showStatic && (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                videoReady ? "opacity-100" : "opacity-0"
              }`}
              style={{ willChange: "transform" }}
            />
          )}

          {/* Scrims are maroon-black (#120608-family), not the neutral blue-black
              they used to be — against the warm page below, a cool scrim made
              the hero footage read as a different site. */}
          {/* Base scrim: keeps the footage from ever sitting raw behind the page. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 120% 90% at 50% 45%, rgba(18,6,8,0) 30%, rgba(18,6,8,.72) 100%)",
            }}
          />
          {/* Left-side scrim: the headline and buttons live here. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, rgba(18,6,8,.85) 0%, rgba(18,6,8,.55) 34%, rgba(18,6,8,0) 64%)",
            }}
          />
          {/* Bottom fade into the page ground, so the hero and the section
              under it never meet at a visible seam. */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, rgba(18,6,8,0), #120608)",
            }}
          />
          {/* Ambient brand glows + dot matrix, matching the rest of the page. */}
          <div className="absolute top-1/4 right-6 lg:right-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />
        </div>

        {/* Content — drifts and fades at its own rate as the hero scrolls,
            independent of the video's motion behind it (see applyParallax). */}
        <div
          ref={contentRef}
          className="relative z-10 h-full w-full flex flex-col pt-20 md:pt-24 pb-16"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="w-full flex items-start mt-4 md:mt-6">
            <div className="w-full max-w-[1280px] mx-auto px-5 md:px-16">
              <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-5">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  className="inline-flex w-fit mx-auto md:mx-0 items-center gap-2 rounded-full border border-tertiary-container/30 bg-surface-container/70 px-3.5 py-1.5 backdrop-blur-md"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-tertiary-container motion-safe:animate-ping" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-tertiary-fixed">
                    {t("heritage")}
                  </span>
                </motion.div>

                {/* Playfair runs considerably wider than the Inter it replaced,
                    so the old 7xl step pushed "Builds Champions." onto a third
                    line inside this half-width column.

                    Tamil gets fluid sizing rather than the Latin step ramp.
                    "வெற்றியாளர்களை" is one unbreakable word that has to fit the
                    column outright, and at the Latin sizes it overflowed at
                    every width — worst at lg, where the column halves to w-1/2
                    while the type is still at its largest step. The two clamps
                    are measured against that word: the upper bounds are where
                    it exactly fills the column at 768px and at 1280px, where
                    the container stops growing. */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`font-display font-extrabold text-on-primary tracking-tight text-center md:text-left ${
                    locale === "ta"
                      ? "text-[clamp(1.35rem,7vw,2.9rem)] lg:text-[clamp(2rem,3.6vw,3rem)]"
                      : "text-4xl sm:text-5xl md:text-6xl leading-[1.12]"
                  }`}
                  style={{ textShadow: "0 1px 2px rgba(10,3,4,.95), 0 3px 12px rgba(10,3,4,.78), 0 10px 44px rgba(10,3,4,.8)" }}
                >
                  {t("headline_1")}
                  <span
                    className="block bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(90deg, #fde68a 0%, #fbbf24 50%, #fef3c7 100%)",
                      textShadow: "0 2px 16px rgba(10,3,4,.7)",
                    }}
                  >
                    {t("headline_2")}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`${locale === "ta" ? "text-sm" : "text-base md:text-lg"} text-on-surface-variant max-w-lg mx-auto md:mx-0 leading-relaxed text-center md:text-left`}
                  style={{ textShadow: "0 1px 2px rgba(10,3,4,.95), 0 3px 12px rgba(10,3,4,.78)" }}
                >
                  {t("description")}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                  className={`flex flex-wrap justify-center md:justify-start gap-3 mt-2 ${locale === "ta" ? "text-sm" : ""}`}
                >
                  <Button href="#join">{t("join")}</Button>
                  <Button href="#about" variant="secondary">
                    {t("explore")}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          {/* The stat strip spans the container rather than sitting inside the
              half-width text column — at 1/2 width the three labels wrap and
              the bar stops reading as one horizontal rail. mt-auto pins it to
              the bottom of the hero, clear of the scroll chevron below. */}
          <div className="mt-auto w-full max-w-[1280px] mx-auto px-5 md:px-16">
            <HeroStats />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ opacity: { duration: 0.8, delay: 1 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-tertiary-container/70"
            aria-hidden="true"
          >
            <ChevronDown size={28} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
