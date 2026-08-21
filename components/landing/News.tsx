"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/landing/ui/SectionHeading";
import ParallaxDecor from "@/components/landing/ui/ParallaxDecor";

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FlipCard({ post, index }: { post: Post; index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    // Stagger the flips so they don't all flip at the exact same time
    const timeout = setTimeout(() => {
      
      // Perform initial flip to teach the user
      if (!isHoveredRef.current) {
        setIsFlipped(true);
      }

      // Start continuous auto-flipping
      const interval = setInterval(() => {
        if (!isHoveredRef.current) {
          setIsFlipped((prev) => !prev);
        }
      }, 3500); // Faster auto-play (every 3.5 seconds)

      return () => clearInterval(interval);
    }, 1000 + index * 800); // Tighter stagger sequence

    return () => clearTimeout(timeout);
  }, [index]);

  return (
    <div 
      className="relative w-full h-100 md:h-112.5 cursor-pointer group"
      style={{ perspective: 1500 }}
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => (isHoveredRef.current = false)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 35, mass: 0.6 }} // Ultra-fast snap
      >
        {/* Front Side: Cover Image */}
        <div 
          className="absolute inset-0 bg-black rounded-4xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow border border-outline-variant/20"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {post.coverImageUrl ? (
            <Image 
              src={post.coverImageUrl} 
              alt={post.title} 
              fill 
              className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
              sizes="(max-width: 768px) 100vw, 33vw" 
            />
          ) : (
            <div className="absolute inset-0 bg-surface-variant flex items-center justify-center" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <span className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 inline-block shadow-sm">
              {post.category}
            </span>
            <h3 className="text-white text-xl md:text-2xl font-display font-bold leading-tight">
              {post.title}
            </h3>
          </div>
        </div>

        {/* Back Side: Text Content */}
        <div 
          className="absolute inset-0 bg-surface-container-lowest border border-outline-variant/30 rounded-4xl shadow-lg p-6 md:p-8 flex flex-col"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-display font-bold text-on-surface mb-4 leading-tight line-clamp-3 h-18.75 md:h-22.5">
            {post.title}
          </h3>
          
          <div className="relative flex-1 overflow-hidden mb-4">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface-container-lowest to-transparent pointer-events-none z-10" />
            <p className="text-on-surface-variant text-sm md:text-base whitespace-pre-line absolute inset-0">
              {post.excerpt ? `${post.excerpt}\n\n${post.content.replace(/<[^>]*>?/gm, '')}` : post.content.replace(/<[^>]*>?/gm, '')}
            </p>
          </div>
          
          <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            <span>KCSC</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function News() {
  const t = useTranslations("News");
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/posts?limit=3") // Fetch EXACTLY 3 for the flip cards
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

  return (
    <section 
      id="news" 
      className="relative py-16 md:py-20 overflow-hidden"
    >
      <ParallaxDecor variant="maroon" />
      <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm pointer-events-none" />
      <div className="relative max-w-[1280px] mx-auto px-5 md:px-16">

        {/* Sleek Header matching Gallery/About */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            accent={t("accent")}
            description={t("description")}
            className="flex-1"
          />
          <Link 
            href={`/${locale}/news`}
            className="group flex items-center gap-2 text-primary font-semibold hover:text-on-surface transition-colors mb-2 md:mb-6"
          >
            {t("view_all")} 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {posts === null ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3].map(i => <div key={i} className="h-100 md:h-112.5 bg-surface-container rounded-4xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant max-w-6xl mx-auto h-100">
            <p>{t("no_news")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post, index) => (
              <FlipCard key={post._id} post={post} index={index} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
