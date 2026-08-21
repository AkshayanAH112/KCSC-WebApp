"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NewsClientPage({ posts }: { posts: any[] }) {
  const t = useTranslations("NewsPage");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleRecentCount, setVisibleRecentCount] = useState(3);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleRecentCount(3);
  }, [search, activeCategory]);

  const categories = [
    { label: t("topic_all"), value: "all" },
    { label: t("topic_news"), value: "news" },
    { label: t("topic_event"), value: "event" },
    { label: t("topic_blog"), value: "blog" },
    { label: t("topic_achievement"), value: "achievement" }
  ];

  // Filtering
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || 
                          (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Buckets (Colombo Colts duplicates top posts into trending and recent)
  const featuredPost = filteredPosts[0];
  const asidePosts = filteredPosts.slice(1, 4);
  const trendingPosts = filteredPosts.slice(0, 3);
  const allRecentPosts = filteredPosts;
  const recentPosts = allRecentPosts.slice(0, visibleRecentCount);
  const hasMoreRecent = visibleRecentCount < allRecentPosts.length;

  // Format date helper
  const formatDate = (date: any) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="bg-surface-container-lowest min-h-screen pt-24 pb-24">
      {/* Header */}
      <header className="max-w-[1280px] mx-auto px-5 md:px-16 pt-4 mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">
          <Link href="/" className="hover:text-primary transition-colors">{t("home")}</Link>
          <ChevronRight size={14} />
          <span className="text-primary">{t("news")}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
              <span className="w-6 h-0.5 bg-primary"></span>
              {t("eyebrow")}
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-on-surface leading-tight tracking-tight">
              {t("title")} <span className="text-primary">{t("accent")}</span>
            </h1>
          </div>
          <p className="text-base text-on-surface-variant max-w-md md:text-right pb-2">
            {t("description")}
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 md:p-5 bg-surface rounded-2xl border border-outline-variant/30 shadow-soft">
          <div className="relative w-full md:w-64 shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder={t("search_placeholder")} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mr-2">{t("topics")}</span>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg border transition-colors ${
                  activeCategory === cat.value 
                  ? "bg-primary border-primary text-on-primary" 
                  : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="max-w-[1280px] mx-auto px-5 md:px-16">
          <div className="p-12 text-center text-on-surface-variant bg-surface-container-low border border-outline-variant/30 rounded-2xl">
            {t("no_results")}
          </div>
        </div>
      ) : (
        <main className="max-w-[1280px] mx-auto px-5 md:px-16 flex flex-col gap-16">
          
          {/* Split Section (Featured + Aside) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Featured Post (Left, 7 columns) */}
            {featuredPost && (
              <Link href={`/news/${featuredPost.slug}`} className="lg:col-span-7 group flex flex-col relative rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm transition-transform hover:-translate-y-1 min-h-[400px]">
                <div className="absolute top-4 left-4 z-10 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                  {featuredPost.category}
                </div>
                
                <div className="relative flex-1 w-full overflow-hidden">
                  <Image 
                    src={featuredPost.coverImageUrl || "/Logo.jpeg"} 
                    alt={featuredPost.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A1A] via-[#0A1A1A]/60 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {featuredPost.title}
                  </h2>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-semibold text-white/80">
                      {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      {t("read_story")} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Aside Posts (Right, 5 columns) */}
            {asidePosts.length > 0 && (
              <aside className="lg:col-span-5 flex flex-col h-full bg-surface-container-low rounded-3xl border border-outline-variant/30 p-1">
                <div className="p-4 flex items-center justify-between border-b border-outline-variant/30 mx-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-primary"></span>
                    {t("more_headlines")}
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  {asidePosts.map((post, index) => (
                    <Link key={post._id} href={`/news/${post.slug}`} className={`flex gap-4 p-5 transition-all group relative flex-1 items-center ${index !== asidePosts.length - 1 ? 'border-b border-outline-variant/20' : ''} hover:bg-surface-container-high/50 first:rounded-t-none last:rounded-b-3xl`}>
                      <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container-high shadow-sm">
                        <Image 
                          src={post.coverImageUrl || "/Logo.jpeg"} 
                          alt={post.title} 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 h-full justify-center pr-6">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5 truncate">
                          {post.category}
                        </span>
                        <h3 className="text-sm md:text-base font-display font-bold text-on-surface leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <div className="mt-auto">
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-colors shadow-sm">
                        <ChevronRight size={14} />
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>

          {/* Trending Block */}
          {trendingPosts.length > 0 && (
            <section className="pt-16 border-t border-outline-variant/30">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-on-surface uppercase tracking-wide">
                  {t("trending")}
                </h2>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-primary to-transparent max-w-[120px]"></div>
              </div>
              <p className="text-sm text-on-surface-variant mb-8">{t("trending_desc")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingPosts.map((post, i) => (
                  <Link key={post._id} href={`/news/${post.slug}`} className="flex gap-4 p-5 rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group">
                    <span className="text-4xl font-display font-bold text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                      0{i + 1}
                    </span>
                    <div className="flex flex-col min-w-0 pt-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                        {post.category.replace("-", " ")}
                      </span>
                      <h3 className="text-xl font-display font-bold text-on-surface leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <span className="text-[10px] font-semibold text-on-surface-variant mt-auto">
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent News Grid */}
          {recentPosts.length > 0 && (
            <section className="pt-16 border-t border-outline-variant/30">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-on-surface uppercase tracking-wide mb-2">
                {t("recent")}
              </h2>
              <p className="text-sm text-on-surface-variant mb-8">{t("recent_desc")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPosts.map(post => (
                  <Link key={post._id} href={`/news/${post.slug}`} className="flex flex-col rounded-2xl bg-surface border border-outline-variant/30 shadow-sm hover:border-primary/40 hover:shadow-md transition-all overflow-hidden group">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-high">
                      <Image 
                        src={post.coverImageUrl || "/Logo.jpeg"} 
                        alt={post.title} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    <div className="flex flex-col p-5 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-2">
                        {post.category.replace("-", " ")}
                      </span>
                      <h3 className="text-xl font-display font-bold text-on-surface leading-tight line-clamp-2 mb-4 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-semibold text-on-surface-variant">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface">
                          {t("read")}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {visibleRecentCount === 3 && (
                <div className="mt-12 text-center">
                  <button 
                    onClick={() => setVisibleRecentCount(Math.max(100, allRecentPosts.length))}
                    className="inline-flex items-center justify-center px-8 py-3 bg-surface border-2 border-outline-variant/50 text-on-surface font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
                  >
                    {t("load_more")}
                  </button>
                </div>
              )}
            </section>
          )}

        </main>
      )}
    </div>
  );
}
