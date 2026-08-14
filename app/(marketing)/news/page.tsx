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
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ChevronLeft size={16} /> Back to Home
          </Link>
        </div>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-on-surface mb-4">All News & Updates</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Catch up on all the stories, match reports, and announcements from our club.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-on-surface-variant">No news posted yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post: any) => (
              <article
                key={post._id.toString()}
                className="flex flex-col bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 group h-full"
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
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-on-surface-variant text-sm mb-4 flex-grow line-clamp-2">
                    {post.excerpt}
                  </p>

                  <Link 
                    href={`/news/${post.slug}`}
                    className="text-primary font-semibold text-xs mt-auto flex items-center gap-1 group-hover:gap-2 transition-all pointer-events-auto"
                  >
                    Read Full Story <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
