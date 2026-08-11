"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  category: string;
  publishedAt?: string;
  createdAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function News() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/posts?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <section id="news" className="relative py-24 md:py-32 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm" />
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-16 pointer-events-auto">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-on-background tracking-tight">
              News & Updates
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed">
              The latest match reports, club announcements, and stories from the KCSC community.
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

        {posts === null ? (
          <p className="text-on-surface-variant">Loading news…</p>
        ) : posts.length === 0 ? (
          <p className="text-on-surface-variant">No news posted yet — check back soon.</p>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8"
          >
            {posts.map((post) => (
              <article
                key={post._id}
                className="flex flex-col shrink-0 snap-start bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 group w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div className="w-full aspect-video bg-surface-container-high relative overflow-hidden shrink-0">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 font-medium text-sm">
                      Article Image
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
                      {post.category}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-on-surface-variant mb-6 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>

                  <button className="text-primary font-semibold text-sm self-start flex items-center gap-1 hover:gap-2 transition-all mt-auto">
                    Read Full Story <span>→</span>
                  </button>
                </div>
              </article>
            ))}

            <div className="shrink-0 snap-start flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer group w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-h-[300px]">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <ChevronRight size={24} className="text-primary group-hover:text-on-primary" />
              </div>
              <span className="font-semibold text-on-surface">View All News</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
