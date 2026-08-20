"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Folder as FolderIcon } from "lucide-react";
import FolderSection from "./FolderSection";

export default function GalleryClientPage({ folders }: { folders: any[] }) {
  const [search, setSearch] = useState("");

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface-container-lowest min-h-screen pt-24 pb-24">
      {/* Header */}
      <header className="max-w-[1280px] mx-auto px-5 md:px-16 pt-4 mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-primary">Gallery</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
              <span className="w-6 h-0.5 bg-primary"></span>
              Photo Albums
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-on-surface leading-tight tracking-tight">
              Club moments <span className="text-primary">&</span> memories.
            </h1>
          </div>
          <p className="text-base text-on-surface-variant max-w-md md:text-right pb-2">
            Explore our albums featuring memorable matches, behind-the-scenes action, and celebrations from Kallar Central Sports Club.
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 mb-16">
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 md:p-5 bg-surface rounded-2xl border border-outline-variant/30 shadow-soft">
          <div className="relative w-full shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search albums..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-16">
        {filteredFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No gallery albums match your search.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {filteredFolders.map((folder: any, idx: number) => (
              <FolderSection 
                key={folder._id} 
                folder={folder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
