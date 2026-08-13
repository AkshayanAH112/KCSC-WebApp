"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/posts?limit=12") // Increased limit slightly so the "all" view has more content
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

  // Handle body scroll locking when modals are open
  useEffect(() => {
    if (selectedPost || showAllModal) {
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
  }, [selectedPost, showAllModal]);

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
            {posts.slice(0, 6).map((post) => ( // Only show top 6 in the horizontal scroll
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
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
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

                  <h3 className="text-xl font-display font-bold text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-on-surface-variant mb-6 flex-grow line-clamp-3">
                    {post.excerpt}
                  </p>

                  <button 
                    onClick={() => setSelectedPost(post)}
                    className="text-primary font-semibold text-sm self-start flex items-center gap-1 hover:gap-2 transition-all mt-auto"
                  >
                    Read Full Story <span>→</span>
                  </button>
                </div>
              </article>
            ))}

            <div 
              onClick={() => setShowAllModal(true)}
              className="shrink-0 snap-start flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer group w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-h-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <ChevronRight size={24} className="text-primary group-hover:text-on-primary" />
              </div>
              <span className="font-semibold text-on-surface">View All News</span>
            </div>
          </div>
        )}

        {/* View All News Modal Overlay */}
        {showAllModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setShowAllModal(false)}
            />
            
            <div className="relative w-full max-w-7xl h-full bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between p-6 md:px-8 border-b border-outline-variant/20 bg-surface-container-lowest z-10">
                <div>
                  <h3 className="text-2xl font-display font-bold text-on-surface">All News & Updates</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{posts?.length || 0} stories available</p>
                </div>
                <button 
                  onClick={() => setShowAllModal(false)}
                  className="p-2 bg-surface hover:bg-surface-container-high rounded-full border border-outline-variant transition-colors text-on-surface"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto w-full hide-scrollbar p-6 md:p-8 flex-grow bg-surface-container-lowest/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {posts?.map((post) => (
                    <article
                      key={post._id}
                      className="flex flex-col bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 group h-full cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="w-full aspect-video bg-surface-container-high relative overflow-hidden shrink-0">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 font-medium text-sm">
                            Article Image
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(post.publishedAt ?? post.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-lg font-display font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-on-surface-variant text-sm mb-4 flex-grow line-clamp-2">
                          {post.excerpt}
                        </p>

                        <span className="text-primary font-semibold text-xs mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read Full Story <span>→</span>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Post Modal Overlay - Rendered after (so on top of) View All Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 md:p-12">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedPost(null)}
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>

              {/* Scrollable Area */}
              <div className="overflow-y-auto w-full hide-scrollbar flex-grow">
                {selectedPost.coverImageUrl && (
                  <div className="w-full aspect-[21/9] md:aspect-[21/7] relative bg-surface-container-high">
                    <Image
                      src={selectedPost.coverImageUrl}
                      alt={selectedPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="px-6 py-10 md:px-12 md:py-16">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                        {selectedPost.category}
                      </span>
                      <span className="text-sm font-medium text-on-surface-variant">
                        {formatDate(selectedPost.publishedAt ?? selectedPost.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4 text-on-surface">
                      {selectedPost.title}
                    </h2>

                    {selectedPost.excerpt && (
                      <p className="text-lg md:text-xl text-on-surface-variant font-medium mb-8 leading-relaxed border-l-4 border-primary pl-4">
                        {selectedPost.excerpt}
                      </p>
                    )}

                    <div className="prose prose-lg prose-slate prose-headings:font-display prose-headings:text-on-surface prose-p:text-on-surface-variant prose-a:text-primary max-w-none">
                      {selectedPost.content.split('\n').map((paragraph, idx) => {
                        if (!paragraph.trim()) return null; // Skip empty lines between paragraphs
                        return <p key={idx}>{paragraph}</p>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
