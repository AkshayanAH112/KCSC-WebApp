"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface GalleryImage {
  url: string;
  caption?: string;
}

export default function Gallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/gallery?limit=30")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setImages(data.images ?? []);
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

  // Handle body scroll locking when modal is open
  useEffect(() => {
    if (showAllModal) {
      document.body.style.overflow = "hidden";
      window.dispatchEvent(new CustomEvent("modal-toggle", { detail: { isOpen: true } }));
    } else {
      document.body.style.overflow = "auto";
      window.dispatchEvent(new CustomEvent("modal-toggle", { detail: { isOpen: false } }));
    }
    return () => {
      document.body.style.overflow = "auto";
      window.dispatchEvent(new CustomEvent("modal-toggle", { detail: { isOpen: false } }));
    };
  }, [showAllModal]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const itemElement = scrollRef.current.firstElementChild as HTMLElement;
      if (itemElement) {
        const scrollAmount = itemElement.offsetWidth + 24; 
        scrollRef.current.scrollBy({
          left: dir === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <section id="gallery" className="relative py-24 md:py-32 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-surface-container-low/50 backdrop-blur-md" />
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-16 pointer-events-auto">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-on-background tracking-tight">
              Gallery
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
              Moments, matches, and memories from the ground. Check out our latest photos and events.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => scroll('left')}
              className="p-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll left"
              disabled={loading || images.length === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll right"
              disabled={loading || images.length === 0}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 rounded-2xl bg-surface-container/50 animate-pulse aspect-4/3 w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface-variant">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No gallery images uploaded yet.</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8"
          >
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className="relative shrink-0 snap-start rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-all duration-300 group aspect-4/3 w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <Image 
                  src={img.url} 
                  alt={img.caption || `Gallery Image ${idx + 1}`} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white text-sm font-medium">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
            
            <div 
              onClick={() => setShowAllModal(true)}
              className="shrink-0 snap-start flex flex-col items-center justify-center aspect-4/3 w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <ChevronRight size={24} className="text-primary group-hover:text-on-primary" />
              </div>
              <span className="font-semibold text-on-surface">View All Photos</span>
            </div>
          </div>
        )}

        {/* View All Photos Modal Overlay */}
        {showAllModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 md:p-12">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setShowAllModal(false)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-7xl h-full bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:px-8 border-b border-outline-variant/20 bg-surface-container-lowest z-10">
                <div>
                  <h3 className="text-2xl font-display font-bold text-on-surface">Full Gallery</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{images.length} photos available</p>
                </div>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="p-2 bg-surface hover:bg-surface-container-high rounded-full border border-outline-variant transition-colors text-on-surface"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Grid Area */}
              <div className="overflow-y-auto w-full hide-scrollbar p-6 md:p-8 grow bg-surface-container-lowest/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-all duration-300 group aspect-4/3"
                    >
                      <Image 
                        src={img.url} 
                        alt={img.caption || `Gallery Image ${idx + 1}`} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                      {img.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <p className="text-white text-sm font-medium">{img.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </section>
  );
}
