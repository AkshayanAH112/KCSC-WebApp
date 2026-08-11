"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const placeholders = [
    { id: 1, label: "Match Highlights" },
    { id: 2, label: "Training Sessions" },
    { id: 3, label: "Team Celebrations" },
    { id: 4, label: "Award Ceremonies" },
    { id: 5, label: "Community Events" },
    { id: 6, label: "Youth Development" },
    { id: 7, label: "Behind the Scenes" },
    { id: 8, label: "Championship Win" },
  ];

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      // Get the width of one item + gap dynamically
      const itemElement = scrollRef.current.firstElementChild as HTMLElement;
      if (itemElement) {
        const scrollAmount = itemElement.offsetWidth + 24; // width + gap
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
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8"
        >
          {placeholders.map((item) => (
            <div 
              key={item.id} 
              className="relative shrink-0 snap-start rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-shadow duration-300 group aspect-[4/3] w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <div className="absolute inset-0 bg-surface-container-high/50 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-on-surface font-semibold text-lg">{item.label}</span>
                <span className="text-on-surface-variant/70 font-medium text-sm mt-2">Image {item.id}</span>
              </div>
            </div>
          ))}
          
          <div className="shrink-0 snap-start flex flex-col items-center justify-center aspect-[4/3] w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <ChevronRight size={24} className="text-primary group-hover:text-on-primary" />
            </div>
            <span className="font-semibold text-on-surface">View All Photos</span>
          </div>
        </div>
        
      </div>
    </section>
  );
}
