"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Smartphone,
  Monitor,
  Share2,
  Globe,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Sparkles,
  Info,
} from "lucide-react";
import { PostDraft } from "@/components/post-editor";
import { POST_CATEGORY_LABELS } from "@/lib/post-categories";

interface PostPreviewModalProps {
  open: boolean;
  onClose: () => void;
  post: PostDraft;
}

export function PostPreviewModal({ open, onClose, post }: PostPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"website" | "social">("website");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [socialPlatform, setSocialPlatform] = useState<
    "all" | "whatsapp" | "facebook" | "twitter" | "google"
  >("all");
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title = post.title.trim() || "Untitled News Article";
  const excerpt =
    post.excerpt.trim() ||
    (post.content
      ? post.content.replace(/<[^>]+>/g, "").slice(0, 160) + "…"
      : "Read the latest update, announcements, and match results from Kallar Central Sports Club.");
  const categoryLabel =
    POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] ||
    post.category ||
    "News";

  const slug = post.title
    ? post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    : "news-article";

  const publicUrl = `https://kcsc.lk/news/${slug}`;
  const displayDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Globe size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Live Post & Social Media Preview
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {post.status}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Preview how this article appears on the public website and when shared across social channels.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Website vs Social */}
            <div className="flex items-center bg-muted p-1 rounded-xl border border-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("website")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "website"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe size={14} /> Website View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("social")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "social"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Share2 size={14} /> Social Cards
              </button>
            </div>

            {/* Desktop / Mobile Device Switcher for Website View */}
            {activeTab === "website" && (
              <div className="hidden sm:flex items-center bg-muted p-1 rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  title="Desktop View"
                  className={`p-1.5 rounded-lg transition-all ${
                    device === "desktop"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  title="Mobile View"
                  className={`p-1.5 rounded-lg transition-all ${
                    device === "mobile"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone size={15} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              title="Copy preview link"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden md:inline">{copied ? "Copied" : "Copy URL"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20">
          {activeTab === "website" ? (
            /* WEBSITE PREVIEW TAB */
            <div className="flex justify-center w-full">
              {device === "desktop" ? (
                /* DESKTOP WEBSITE SIMULATION */
                <div className="w-full max-w-4xl rounded-2xl border border-[#fbbf24]/20 bg-[#120608] text-[#f5ebe6] shadow-2xl overflow-hidden">
                  {/* Browser chrome header simulation */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#170608] border-b border-[#fbbf24]/15 text-xs text-[#c9bdb8]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-[#120608] border border-[#fbbf24]/10 text-[11px] text-[#fde68a] font-mono">
                      <span>https://kcsc.lk/news/{slug}</span>
                    </div>
                    <div className="text-[10px] text-[#c9bdb8]/60 uppercase tracking-widest font-mono">
                      Desktop View
                    </div>
                  </div>

                  {/* Article content header */}
                  <div className="p-6 md:p-10 border-b border-[#fbbf24]/15 bg-gradient-to-b from-[#1c070a] to-[#120608]">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#c9bdb8] mb-4">
                      <span>Home</span>
                      <span className="text-[#c9bdb8]/40">/</span>
                      <span>News</span>
                      <span className="text-[#c9bdb8]/40">/</span>
                      <span className="text-[#fde68a]">{categoryLabel}</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#f5ebe6] uppercase tracking-wide leading-tight mb-4">
                      {title}
                    </h1>

                    <div className="flex items-center gap-4 text-xs font-semibold text-[#c9bdb8]">
                      <span className="bg-[#b91c1c] text-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {categoryLabel}
                      </span>
                      <span>{displayDate}</span>
                      <span>•</span>
                      <span>By {post.author || "Kallar Central Sports Club"}</span>
                    </div>
                  </div>

                  {/* Article main body */}
                  <div className="p-6 md:p-10 space-y-6">
                    {/* Cover image preview */}
                    {post.coverImageUrl ? (
                      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#fbbf24]/20 shadow-lg bg-[#170608]">
                        <Image
                          src={post.coverImageUrl}
                          alt={title}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[21/9] rounded-2xl border border-dashed border-[#fbbf24]/20 bg-[#170608]/50 flex flex-col items-center justify-center p-6 text-center text-[#c9bdb8]">
                        <Info size={28} className="text-[#fbbf24] mb-2 opacity-70" />
                        <span className="text-sm font-semibold text-[#fde68a]">No Cover Image Added</span>
                        <span className="text-xs text-[#c9bdb8]/70 mt-1 max-w-sm">
                          Articles with a cover image stand out significantly better and look much richer when shared on social media.
                        </span>
                      </div>
                    )}

                    {/* Excerpt callout */}
                    {post.excerpt && (
                      <div className="p-5 rounded-xl bg-[#1c070a] border-l-4 border-[#b91c1c] border border-[#fbbf24]/10 text-sm md:text-base font-medium text-[#f5ebe6] leading-relaxed">
                        {post.excerpt}
                      </div>
                    )}

                    {/* Rich text body preview */}
                    <div className="bg-[#170608] p-6 md:p-8 rounded-2xl border border-[#fbbf24]/10">
                      {post.content ? (
                        <div
                          className="prose prose-invert max-w-none text-[#c9bdb8] prose-headings:text-[#fde68a] prose-strong:text-[#f5ebe6] prose-a:text-[#fbbf24] prose-blockquote:border-[#fbbf24]/40"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      ) : (
                        <div className="py-8 text-center text-[#c9bdb8] italic text-sm">
                          No body content written yet. Type in the content field to preview.
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[#fbbf24]/10 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-md bg-[#1c070a] border border-[#fbbf24]/20 text-[11px] font-semibold text-[#fde68a] uppercase tracking-wider"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Gallery Images Preview */}
                    {post.images && post.images.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#fde68a]">
                          Photo Gallery ({post.images.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {post.images.map((img, i) => (
                            <div
                              key={img.url + i}
                              className="relative aspect-video rounded-xl overflow-hidden border border-[#fbbf24]/20 bg-[#170608]"
                            >
                              <Image
                                src={img.url}
                                alt={img.caption || `Gallery ${i + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                              {img.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[10px] text-white truncate">
                                  {img.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MOBILE PHONE FRAME SIMULATION */
                <div className="w-[375px] rounded-[42px] border-[10px] border-zinc-900 bg-[#120608] text-[#f5ebe6] shadow-2xl overflow-hidden flex flex-col">
                  {/* Phone notch & status bar */}
                  <div className="flex items-center justify-between px-6 pt-3 pb-2 bg-[#170608] text-[11px] font-semibold text-[#c9bdb8]">
                    <span>9:41</span>
                    <div className="w-20 h-4 rounded-full bg-zinc-900 mx-auto" />
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <span className="w-4 h-2.5 rounded-sm border border-current flex items-center justify-start p-0.5">
                        <span className="w-2 h-full bg-current rounded-2xs" />
                      </span>
                    </div>
                  </div>

                  {/* Mobile browser address bar */}
                  <div className="px-4 py-2 bg-[#170608] border-b border-[#fbbf24]/10 text-center text-[10px] text-[#fde68a] truncate font-mono">
                    kcsc.lk/news/{slug}
                  </div>

                  {/* Scrollable Mobile Page */}
                  <div className="flex-1 overflow-y-auto max-h-[620px] p-4 space-y-4">
                    <div className="space-y-2">
                      <span className="inline-block bg-[#b91c1c] text-[#fef3c7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded">
                        {categoryLabel}
                      </span>
                      <h1 className="text-xl font-bold uppercase text-[#f5ebe6] leading-tight">
                        {title}
                      </h1>
                      <div className="text-[10px] text-[#c9bdb8]">
                        {displayDate} • By {post.author || "KCSC"}
                      </div>
                    </div>

                    {post.coverImageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#fbbf24]/20">
                        <Image
                          src={post.coverImageUrl}
                          alt={title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    {post.excerpt && (
                      <div className="p-3.5 rounded-xl bg-[#1c070a] border-l-2 border-[#b91c1c] text-xs text-[#f5ebe6]">
                        {post.excerpt}
                      </div>
                    )}

                    <div className="text-xs text-[#c9bdb8] leading-relaxed">
                      {post.content ? (
                        <div
                          className="prose prose-invert prose-sm max-w-none text-[#c9bdb8]"
                          dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                      ) : (
                        <p className="italic text-center py-4">No content</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SOCIAL MEDIA CARDS PREVIEW TAB */
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Social Platform Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  Filter platform:
                </span>
                {(["all", "whatsapp", "facebook", "twitter", "google"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSocialPlatform(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      socialPlatform === p
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "all" ? "All Platforms" : p === "twitter" ? "X (Twitter)" : p}
                  </button>
                ))}
              </div>

              {/* WHATSAPP CARD PREVIEW */}
              {(socialPlatform === "all" || socialPlatform === "whatsapp") && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <MessageCircle size={16} />
                      </span>
                      WhatsApp Link Preview
                    </div>
                    <span className="text-[11px] text-muted-foreground">Mobile & Web Chat</span>
                  </div>

                  {/* Realistic WhatsApp Chat Bubble */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-[#0b141a] text-white max-w-md mx-auto sm:mx-0 shadow-md">
                    <div className="bg-[#1f2c34] rounded-xl p-2.5 space-y-2 border border-white/5">
                      {/* Rich thumbnail */}
                      <div className="relative w-full aspect-[1.91/1] rounded-lg overflow-hidden bg-black/40">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt="WhatsApp preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#140507] text-[#fde68a] text-xs font-bold uppercase tracking-wider">
                            KCSC • Kallar Central Sports Club
                          </div>
                        )}
                      </div>

                      {/* Card meta text */}
                      <div className="px-1 py-0.5 space-y-1">
                        <div className="text-[10px] text-white/50 uppercase font-mono tracking-wider">
                          kcsc.lk
                        </div>
                        <div className="text-sm font-bold text-white line-clamp-2 leading-snug">
                          {title}
                        </div>
                        <div className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                          {excerpt}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-emerald-400 underline font-mono break-all">
                      https://kcsc.lk/news/{slug}
                    </div>

                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-white/40">
                      <span>10:45 AM</span>
                      <span className="text-cyan-400 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FACEBOOK FEED CARD PREVIEW */}
              {(socialPlatform === "all" || socialPlatform === "facebook") && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Share2 size={16} />
                      </span>
                      Facebook Feed Post Preview
                    </div>
                    <span className="text-[11px] text-muted-foreground">News Feed Card</span>
                  </div>

                  {/* Realistic Facebook Post Card */}
                  <div className="rounded-xl border border-border bg-card max-w-lg mx-auto sm:mx-0 shadow-md overflow-hidden">
                    {/* Page header */}
                    <div className="flex items-center gap-3 p-3.5">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/20 shrink-0 border border-primary/20">
                        <Image
                          src="/logo-mark.png"
                          alt="KCSC Avatar"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground flex items-center gap-1">
                          Kallar Central Sports Club
                          <span className="inline-block w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                            ✓
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>Just now</span>
                          <span>•</span>
                          <span>🌐</span>
                        </div>
                      </div>
                    </div>

                    {/* Post text message */}
                    <div className="px-3.5 pb-3 text-xs sm:text-sm text-foreground line-clamp-3">
                      {excerpt}
                    </div>

                    {/* Open Graph Large Card */}
                    <div className="border-t border-b border-border bg-muted/30">
                      <div className="relative w-full aspect-[1.91/1] overflow-hidden bg-muted">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt="Facebook link image"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#140507] text-[#fde68a] p-4 text-center">
                            <span className="text-sm font-bold">KALLAR CENTRAL SPORTS CLUB</span>
                            <span className="text-xs text-[#c9bdb8] mt-1">Official News & Announcements</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-card border-t border-border">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                          KCSC.LK
                        </span>
                        <span className="text-sm font-bold text-foreground line-clamp-1 block mt-0.5">
                          {title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 block mt-0.5">
                          {excerpt}
                        </span>
                      </div>
                    </div>

                    {/* Facebook Action Buttons */}
                    <div className="flex items-center justify-around py-2 px-3 text-muted-foreground text-xs font-semibold border-t border-border">
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer py-1">
                        <ThumbsUp size={14} /> Like
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer py-1">
                        <MessageSquare size={14} /> Comment
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer py-1">
                        <Share2 size={14} /> Share
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* X / TWITTER CARD PREVIEW */}
              {(socialPlatform === "all" || socialPlatform === "twitter") && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 text-foreground">
                        <span className="font-bold text-sm">𝕏</span>
                      </span>
                      X (Twitter) Large Summary Card
                    </div>
                    <span className="text-[11px] text-muted-foreground">twitter:card="summary_large_image"</span>
                  </div>

                  {/* Realistic Tweet Card */}
                  <div className="rounded-xl border border-border bg-card max-w-lg mx-auto sm:mx-0 p-4 shadow-md space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/20 shrink-0 border border-primary/20">
                        <Image
                          src="/logo-mark.png"
                          alt="KCSC Avatar"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-foreground">
                            Kallar Central Sports Club
                          </span>
                          <span className="text-xs text-muted-foreground">@kallarcsc</span>
                          <span className="text-xs text-muted-foreground">· 2m</span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground mt-1 leading-snug">
                          {excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Summary Large Image Card */}
                    <div className="rounded-2xl border border-border overflow-hidden bg-card ml-0 sm:ml-12 hover:border-primary/40 transition-colors">
                      <div className="relative w-full aspect-[2/1] bg-muted">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt="X summary card"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#140507] text-[#fde68a] text-xs font-bold uppercase">
                            kcsc.lk
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-muted/20 border-t border-border">
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          kcsc.lk
                        </span>
                        <span className="text-sm font-bold text-foreground line-clamp-1 block mt-0.5">
                          {title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2 block mt-0.5">
                          {excerpt}
                        </span>
                      </div>
                    </div>

                    {/* Tweet Action Icons */}
                    <div className="flex items-center justify-between text-muted-foreground text-xs ml-0 sm:ml-12 pt-1 pr-6">
                      <MessageSquare size={14} className="hover:text-sky-500 cursor-pointer" />
                      <Repeat2 size={16} className="hover:text-emerald-500 cursor-pointer" />
                      <Heart size={14} className="hover:text-pink-500 cursor-pointer" />
                      <Bookmark size={14} className="hover:text-sky-500 cursor-pointer" />
                      <Share2 size={14} className="hover:text-sky-500 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {/* GOOGLE SEARCH RESULT (SEO) PREVIEW */}
              {(socialPlatform === "all" || socialPlatform === "google") && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Sparkles size={16} />
                      </span>
                      Google Search Result Preview
                    </div>
                    <span className="text-[11px] text-muted-foreground">SEO & Meta Tags</span>
                  </div>

                  {/* Google SERP Snippet */}
                  <div className="p-4 sm:p-5 rounded-xl border border-border bg-card max-w-2xl space-y-1.5 shadow-sm">
                    {/* URL & Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-primary">
                        K
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-medium leading-none">
                          Kallar Central Sports Club
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                          https://kcsc.lk › news › {slug}
                        </span>
                      </div>
                    </div>

                    {/* Search Result Title */}
                    <div className="text-base sm:text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer leading-snug">
                      {title} | KCSC News
                    </div>

                    {/* Meta Description Snippet */}
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {excerpt}
                    </p>

                    {/* Character length indicator */}
                    <div className="flex flex-wrap items-center gap-4 pt-3 mt-2 border-t border-border text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            title.length > 10 && title.length <= 60
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>
                          Title: <strong>{title.length}</strong> / 60 chars (Recommended: 30-60)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            excerpt.length >= 50 && excerpt.length <= 160
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>
                          Description: <strong>{excerpt.length}</strong> / 160 chars (Recommended: 50-160)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info size={14} />
            <span>
              {activeTab === "website"
                ? "This preview updates live as you edit the post draft."
                : "Social media previews reflect your title, excerpt, and cover image."}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
}
