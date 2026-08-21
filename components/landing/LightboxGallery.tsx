"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface GalleryImage {
  _id: string;
  url: string;
  caption?: string;
}

interface LightboxGalleryProps {
  images: GalleryImage[];
}

export default function LightboxGallery({ images }: LightboxGalleryProps) {
  const t = useTranslations("LightboxGallery");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1);
    }
  };
  
  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface-variant">
        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
        <p>{t("no_photos")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((img, idx) => (
          <div 
            key={img._id} 
            onClick={() => openLightbox(idx)}
            className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-all duration-300 group aspect-[4/3] cursor-pointer"
          >
            <Image 
              src={img.url} 
              alt={img.caption || `Photo ${idx + 1}`} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-medium">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div className="absolute top-4 right-4 z-[110]">
            <button 
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>
          </div>
          
          <button 
            onClick={showPrev}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[110]"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="relative w-full h-full max-w-7xl max-h-[95vh] px-4 md:px-20 flex items-center justify-center">
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              <Image 
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
                priority
              />
              {images[lightboxIndex].caption && (
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
                  <p className="text-white text-lg font-medium">{images[lightboxIndex].caption}</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={showNext}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[110]"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </>
  );
}
