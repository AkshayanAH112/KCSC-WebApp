"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Button from "@/components/landing/ui/Button";
import HeroStats from "./HeroStats";
import { siteConfig } from "@/lib/constants";

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

          {/* Base scrim: keeps the footage from ever sitting raw behind the page. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 120% 90% at 50% 45%, rgba(10,10,18,0) 35%, rgba(10,10,18,.55) 100%)",
            }}
          />
          {/* Left-side scrim: the headline and buttons live here. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, rgba(8,8,15,.72) 0%, rgba(8,8,15,.42) 32%, rgba(8,8,15,0) 62%)",
            }}
          />
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
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className="font-display text-5xl md:text-7xl leading-tight font-bold text-white tracking-tight"
                  style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78), 0 10px 44px rgba(5,5,10,.8)" }}
                >
                  Where Cricket
                  {/* text-gradient-gold's dark-bronze end reads fine on the rest of
                      the (light) marketing page, but disappears against this dark
                      video — a brighter, hero-only gold gradient instead. */}
                  <span
                    className="block bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #d4af6a 0%, #f3e4c7 100%)",
                      textShadow: "0 2px 16px rgba(5,5,10,.7)",
                    }}
                  >
                    Builds Champions.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className="text-base md:text-lg text-white/80 max-w-lg leading-relaxed"
                  style={{ textShadow: "0 1px 2px rgba(5,5,10,.95), 0 3px 12px rgba(5,5,10,.78)" }}
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
                  <Button href="#about" variant="secondary" className="border-white/70 text-white hover:bg-white hover:text-on-primary">
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
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
            aria-hidden="true"
          >
            <ChevronDown size={28} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
