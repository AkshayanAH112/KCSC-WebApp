"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder as FolderIcon, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";
import FadeInSection from "@/components/landing/ui/FadeInSection";

interface GalleryFolder {
  _id: string;
  name: string;
  coverImageUrl?: string;
  imageCount: number;
}

export default function Gallery() {
  const t = useTranslations("Gallery");
  const locale = useLocale();
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/gallery/folders")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const fetchedFolders = data.folders ?? [];
          const limitedFolders = fetchedFolders.slice(0, 5); // Limit to 5 cards
          setFolders(limitedFolders);
          if (limitedFolders.length > 0) {
            setActiveIndex(Math.floor((limitedFolders.length - 1) / 2));
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (folders.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % folders.length);
    }, 3800);
    
    return () => {
      clearInterval(interval);
    };
  }, [folders.length, isHovered]);

  // Card geometry is derived from the measured container rather than from
  // window.innerWidth read during render — that read produced a different
  // value on the server and the client, and never updated on resize.
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStageW(entry.contentRect.width));
    ro.observe(el);
    setStageW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [loading, folders.length]);

  // Landscape 4:3, matching the design. The flanking cards sit at ~2/3 of a
  // card width so they overlap into a continuous curved wall rather than
  // floating as separate thumbnails.
  const cardW = stageW < 640 ? Math.max(180, stageW * 0.62) : Math.min(420, stageW * 0.4);
  const cardH = cardW * 0.75;
  const step = cardW * 0.66;

  return (
    <FadeInSection id="gallery" className="relative py-16 md:py-20 overflow-hidden pointer-events-none">
      <ParallaxDecor variant="gold" />
      <div className="absolute inset-0 bg-surface-container-low/40" />
      
      <div className="relative w-full max-w-[1280px] mx-auto px-5 md:px-16 pointer-events-auto flex flex-col items-center">
        
        {/* Sleek Header */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            accent={t("accent")}
            description={t("description")}
            className="flex-1"
          />
          <Link 
            href={`/${locale}/gallery`}
            className="group flex items-center gap-2 text-tertiary-container font-bold hover:text-on-primary transition-colors mb-2 md:mb-6"
          >
            {t("view_full")} 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="h-75 md:h-100 w-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-tertiary-container/20 border-t-tertiary-container rounded-full animate-spin" />
          </div>
        ) : folders.length === 0 ? (
          <div className="card-luxury flex flex-col items-center justify-center p-12 rounded-3xl text-on-surface-variant w-full max-w-xl mx-auto h-75">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>{t("no_albums")}</p>
          </div>
        ) : (
          <div
            ref={stageRef}
            className="relative w-full flex items-center justify-center perspective-distant"
            style={{ height: cardH + 56 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <AnimatePresence initial={false}>
              {folders.map((folder, idx) => {
                const isActive = idx === activeIndex;
                
                // Infinite wrapping logic for perfect symmetry
                let diff = idx - activeIndex;
                const halfLength = Math.floor(folders.length / 2);
                if (diff > halfLength) {
                  diff -= folders.length;
                } else if (diff < -halfLength) {
                  diff += folders.length;
                }

                // Transforms. The opacity falloff is gentle on purpose: at the
                // old 0.4/step the third card out was fully invisible, which
                // left two lonely thumbnails instead of the receding wall the
                // design shows.
                const dist = Math.abs(diff);
                const xOffset = diff * step;
                const scale = isActive ? 1 : Math.max(0.55, 1 - dist * 0.14);
                const zIndex = 50 - dist;
                const opacity = isActive ? 1 : Math.max(0.22, 1 - dist * 0.2);
                
                const cardInner = (
                  <>
                    {folder.coverImageUrl ? (
                      <Image
                        src={folder.coverImageUrl}
                        alt={folder.name}
                        fill
                        className={cn(
                          "object-cover transition-all duration-500",
                          isActive ? "group-hover:scale-105" : "brightness-[0.45]"
                        )}
                        sizes="(max-width: 768px) 62vw, 420px"
                        priority={Math.abs(diff) <= 1}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-variant">
                        <FolderIcon className="w-16 h-16 text-tertiary-container/30" />
                      </div>
                    )}
                    
                    {/* Overlay text for active card */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.1 } }}
                          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/65 to-transparent p-5 md:p-6 flex flex-col justify-end pt-20 pointer-events-none"
                        >
                          <h3 className="text-on-primary text-xl md:text-2xl font-display font-bold mb-1 tracking-tight leading-tight wrap-break-word group-hover:text-tertiary-container transition-colors">
                            {folder.name}
                          </h3>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <p className="text-on-surface-variant font-medium text-xs md:text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container inline-block"></span>
                              {folder.imageCount} {folder.imageCount === 1 ? t("photo") : t("photos")}
                            </p>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-primary bg-tertiary-container/30 border border-tertiary-container/50 px-3 py-1 rounded-full group-hover:bg-tertiary-container group-hover:text-black transition-colors shadow-sm">
                              {locale === "ta" ? "ஆல்பத்தைப் பார்க்க" : "View Album"} <ArrowRight size={12} />
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                );

                return (
                  <motion.div
                    key={folder._id}
                    className={cn(
                      "absolute origin-center overflow-hidden rounded-3xl transition-shadow bg-black group cursor-pointer",
                      isActive
                        ? "ring-1 ring-tertiary-container/40 shadow-[0_0_90px_-8px_rgba(251,191,36,0.55)]"
                        : "shadow-xl shadow-black/60"
                    )}
                    style={{ width: cardW, height: cardH }}
                    animate={{
                      x: xOffset,
                      scale,
                      zIndex,
                      opacity,
                      // Steeper than the old 15deg so the flanking cards turn
                      // away into the wall instead of reading as flat tiles.
                      rotateY: Math.max(-58, Math.min(58, diff * -34)),
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 700, // Extremely fast snap
                      damping: 40,
                      mass: 0.5
                    }}
                  >
                    {isActive ? (
                      <Link
                        href={`/${locale}/gallery/${folder._id}`}
                        className="block w-full h-full relative"
                        aria-label={`Open album: ${folder.name}`}
                      >
                        {cardInner}
                      </Link>
                    ) : (
                      <div
                        onClick={() => setActiveIndex(idx)}
                        className="block w-full h-full relative"
                        aria-label={`Select album: ${folder.name}`}
                      >
                        {cardInner}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Dot indicators, per the design — the active one stretches into a
            pill. These replace the prev/next arrows, which the design does not
            have and which could not wrap past the ends anyway. */}
        {!loading && folders.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {folders.map((folder, idx) => (
              <button
                key={folder._id}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show album ${idx + 1} of ${folders.length}`}
                aria-current={idx === activeIndex}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                  idx === activeIndex
                    ? "w-7 bg-tertiary-container"
                    : "w-1.5 bg-on-surface-variant/40 hover:bg-tertiary-container/60"
                )}
              />
            ))}
          </div>
        )}

      </div>
    </FadeInSection>
  );
}
