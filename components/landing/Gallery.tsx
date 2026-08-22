"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Folder as FolderIcon, ArrowRight } from "lucide-react";
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
    
    // Trigger the first animation almost immediately so the user doesn't wait
    const initialTimeout = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % folders.length);
    }, 300);

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % folders.length);
    }, 1200); // Extremely fast auto-play interval
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [folders.length, isHovered]);

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(prev + 1, folders.length - 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <FadeInSection id="gallery" className="relative py-16 md:py-20 overflow-hidden pointer-events-none">
      <ParallaxDecor variant="gold" />
      <div className="absolute inset-0 bg-surface-container-low/30 backdrop-blur-3xl" />
      
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
            className="group flex items-center gap-2 text-primary font-semibold hover:text-on-surface transition-colors mb-2 md:mb-6"
          >
            {t("view_full")} 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="h-75 md:h-100 w-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant w-full max-w-xl mx-auto h-75">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>{t("no_albums")}</p>
          </div>
        ) : (
          <div 
            className="relative w-full h-75 md:h-100 flex items-center justify-center perspective-distant"
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

                // Calculate transforms
                const xOffset = diff * (typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 180); // wider offset for desktop
                const scale = isActive ? 1 : Math.max(0.7, 1 - Math.abs(diff) * 0.15);
                const zIndex = 50 - Math.abs(diff);
                const opacity = Math.max(0, 1 - Math.abs(diff) * 0.4);
                
                return (
                  <motion.div
                    key={folder._id}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "absolute origin-center cursor-pointer overflow-hidden rounded-3xl transition-shadow bg-black",
                      isActive ? "shadow-2xl ring-1 ring-white/10" : "shadow-lg"
                    )}
                    style={{
                      width: typeof window !== 'undefined' && window.innerWidth < 768 ? 220 : 300,
                      aspectRatio: "3/4",
                    }}
                    animate={{
                      x: xOffset,
                      scale,
                      zIndex,
                      opacity,
                      rotateY: diff * -15
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 700, // Extremely fast snap
                      damping: 40,
                      mass: 0.5
                    }}
                  >
                    <>
                        {folder.coverImageUrl ? (
                          <Image
                            src={folder.coverImageUrl}
                            alt={folder.name}
                            fill
                            className={cn(
                              "object-cover transition-opacity duration-300",
                              !isActive && "opacity-40 grayscale-30" // dim background items
                            )}
                            sizes="(max-width: 768px) 260px, 380px"
                            priority={Math.abs(diff) <= 1}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-surface-variant/20">
                            <FolderIcon className="w-16 h-16 text-on-surface-variant/30" />
                          </div>
                        )}
                        
                        {/* Overlay text for active card */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, transition: { duration: 0.1 } }}
                              className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/60 to-transparent p-6 md:p-8 flex flex-col justify-end pt-24 pointer-events-none"
                            >
                              <h3 className="text-white text-2xl md:text-3xl font-display font-bold mb-2 tracking-tight leading-tight">{folder.name}</h3>
                              <p className="text-white/80 font-medium text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                {folder.imageCount} {folder.imageCount === 1 ? t("photo") : t("photos")}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Carousel Navigation Controls */}
        {!loading && folders.length > 1 && (
          <div className="flex items-center gap-4 mt-12">
            <button 
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className="p-4 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-all text-on-surface disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
              aria-label="Previous album"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNext}
              disabled={activeIndex === folders.length - 1}
              className="p-4 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-all text-on-surface disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
              aria-label="Next album"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

      </div>
    </FadeInSection>
  );
}
