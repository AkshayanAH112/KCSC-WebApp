"use client";

import { useState } from "react";
import Image from "next/image";
import { Folder as FolderIcon, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageProps {
  _id?: string;
  url: string;
  caption?: string;
}

interface FolderProps {
  _id: string;
  name: string;
  images: ImageProps[];
}

export default function FolderSection({ folder }: { folder: FolderProps }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const imagesToDisplay = isExpanded ? folder.images : folder.images?.slice(0, 3) || [];
  const hasMore = (folder.images?.length || 0) > 3;

  if (!folder.images || folder.images.length === 0) {
    return null; // Don't show empty folders
  }

  return (
    <section className="mb-20">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-on-surface uppercase tracking-wide">
          {folder.name}
        </h2>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-primary to-transparent max-w-[120px]"></div>
        <span className="ml-auto bg-surface-container-low text-on-surface-variant text-[10px] font-bold px-3 py-1.5 rounded-full border border-outline-variant/30 uppercase tracking-widest hidden md:block">
          {folder.images.length} {folder.images.length === 1 ? 'Photo' : 'Photos'}
        </span>
      </div>
      <p className="text-sm text-on-surface-variant mb-8">Click &apos;Load More&apos; to view all photos in this album.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {imagesToDisplay.map((img, idx) => (
            <motion.div
              key={img._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-md group cursor-pointer"
            >
              <Image
                src={img.url}
                alt={img.caption || folder.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-white font-medium text-sm">
                  View Image
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-8 py-3 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors rounded-xl font-bold uppercase tracking-widest text-xs border border-outline-variant/30 group"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Load More <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
