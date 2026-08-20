import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import connectToDatabase from "@/lib/mongodb";
import { Post } from "@/models";

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Reads Post straight from the DB — see app/(marketing)/gallery/page.tsx for why
// this can't be left to statically prerender at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "All News & Updates | KCSC",
  description: "Read all the latest news, updates, and announcements from Kallar Central Sports Club.",
};

export default async function NewsPage() {
  await connectToDatabase();
  const posts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  return (
    <div className="bg-surface-container-lowest min-h-screen pt-24 pb-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16">
        {/* Header matched to gallery style */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-on-surface max-w-lg leading-tight tracking-tight">
            Latest stories and<br className="hidden md:block"/> club updates.
          </h1>
          <p className="text-base text-on-surface-variant max-w-md md:text-right pb-2">
            Catch up on all the match reports, upcoming events, and important announcements from Kallar Central Sports Club.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-on-surface-variant">No news posted yet — check back soon.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {posts.map((post: any) => (
              <article
                key={post._id.toString()}
                className="flex flex-col md:flex-row gap-4 md:gap-5 items-stretch group"
              >
                {/* Left side: Cover Image */}
                <div className="w-full md:w-[45%] lg:w-[45%] aspect-[4/3] rounded-3xl overflow-hidden relative shrink-0 shadow-soft">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high text-on-surface-variant/40 font-medium text-sm">
                      Article Image
                    </div>
                  )}
                </div>

                {/* Right side: Content */}
                <div className="w-full md:w-[55%] lg:w-[55%] flex flex-col justify-center bg-surface-container-low p-8 md:p-10 rounded-3xl border border-outline-variant/30 shadow-sm">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-on-surface mb-4 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-on-surface-variant text-base md:text-lg mb-8 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-center gap-2 font-semibold text-on-surface mb-6">
                      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="capitalize">{post.category}</span>
                    </div>

                    <div className="flex items-center gap-6 font-semibold">
                      <Link 
                        href={`/news/${post.slug}`}
                        className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors border-b border-on-surface hover:border-primary pb-1 group-hover:gap-3"
                      >
                        Read Full News 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17l9.2-9.2M17 17V7H7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
