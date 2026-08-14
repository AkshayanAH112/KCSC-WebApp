"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Folder as FolderIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GalleryFolder {
  _id: string;
  name: string;
  coverImageUrl?: string;
  imageCount: number;
}

export default function Gallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/gallery/folders")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setFolders(data.folders ?? []);
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
              Explore our albums featuring moments, matches, and memories from the ground.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => scroll('left')}
              className="p-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll left"
              disabled={loading || folders.length === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll right"
              disabled={loading || folders.length === 0}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 rounded-2xl bg-surface-container/50 animate-pulse aspect-[4/3] w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]" />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface-variant">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No gallery albums uploaded yet.</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8"
          >
            {folders.map((folder, idx) => (
              <Link 
                key={idx} 
                href={`/gallery/${folder._id}`}
                className="relative shrink-0 snap-start rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-all duration-300 group aspect-[4/3] w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] block"
              >
                {folder.coverImageUrl ? (
                  <Image 
                    src={folder.coverImageUrl} 
                    alt={folder.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-variant/20">
                    <FolderIcon className="w-16 h-16 text-on-surface-variant/30" />
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-end h-1/2">
                  <h3 className="text-white text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{folder.name}</h3>
                  <p className="text-white/80 text-sm font-medium">{folder.imageCount} {folder.imageCount === 1 ? 'Photo' : 'Photos'}</p>
                </div>
              </Link>
            ))}
            
            <Link 
              href="/gallery"
              className="shrink-0 snap-start flex flex-col items-center justify-center aspect-[4/3] w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer group pointer-events-auto"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <ChevronRight size={24} className="text-primary group-hover:text-on-primary" />
              </div>
              <span className="font-semibold text-on-surface">View All Albums</span>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
