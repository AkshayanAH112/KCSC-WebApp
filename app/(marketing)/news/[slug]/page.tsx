import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import connectToDatabase from "@/lib/mongodb";
import { Post } from "@/models";
import Footer from "@/components/landing/layout/Footer";

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  params: Promise<{ slug: string }>;
};

// Reads Post straight from the DB — see app/(marketing)/gallery/page.tsx for why
// this can't be left to statically prerender at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await Post.findOne({ slug, status: "published" }).lean();
  
  if (!post) {
    return { title: "Post Not Found | KCSC" };
  }

  return {
    title: `${post.title} | KCSC News`,
    description: post.excerpt || `Read ${post.title} on Kallar Central Sports Club.`,
  };
}

export default async function SingleNewsPage({ params }: Props) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await Post.findOne({ slug, status: "published" }).lean();

  if (!post) {
    notFound();
  }

  // Fetch recent posts for the sidebar (exclude current post)
  const recentPosts = await Post.find({ 
    status: "published",
    _id: { $ne: post._id }
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(4)
    .lean();

  return (
    <div className="bg-surface-container-lowest min-h-screen flex flex-col pt-24 pb-0">
      
      {/* Hero Section */}
      <header className="bg-surface relative border-b-2 border-primary/20 pb-16 pt-8 md:pt-16 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        
        <div className="max-w-[1280px] mx-auto px-5 md:px-16 relative z-10">
          <div className="flex flex-col lg:w-3/4">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="text-on-surface-variant/40">/</span>
              <Link href="/news" className="hover:text-primary transition-colors">News</Link>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-on-surface leading-[1.1] uppercase tracking-wide mb-6">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 text-on-surface-variant font-semibold">
              <span className="bg-primary text-on-primary px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-md shadow-sm">
                Published
              </span>
              <time className="text-xs md:text-sm tracking-wide">
                {formatDate(post.publishedAt || post.createdAt)}
              </time>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content & Sidebar Grid */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 w-full relative z-10 -mt-8 mb-24 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Featured Image & Article Body */}
          <div className="lg:col-span-8 flex flex-col min-w-0 w-full">
            
            {/* Featured Image Box */}
            {post.coverImageUrl && (
              <figure className="m-0 border border-outline-variant/30 shadow-md bg-surface-container-high relative w-full aspect-[16/9] mb-8 rounded-2xl overflow-hidden z-20">
                <Image 
                  src={post.coverImageUrl} 
                  alt={post.title} 
                  fill
                  className="object-contain"
                  priority
                />
              </figure>
            )}

            {/* Article Content Container */}
            <div className="bg-surface-container-low p-6 md:p-12 shadow-soft border border-outline-variant/20 rounded-3xl min-w-0 -mt-16 pt-20">
              {post.excerpt && (
                <div className="text-base md:text-lg font-semibold text-on-surface mb-8 pb-8 border-b border-outline-variant/30 leading-relaxed border-l-4 border-l-primary pl-6 bg-surface/50 p-6 rounded-r-xl">
                  {post.excerpt}
                </div>
              )}

              {/* Prose Content */}
              <div 
                className="prose prose-lg md:prose-xl prose-invert prose-headings:font-display prose-headings:text-on-surface prose-headings:tracking-wide prose-p:text-on-surface-variant prose-a:text-primary max-w-none text-on-surface-variant break-words"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags Section */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-outline-variant/20 flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1.5 bg-surface text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-md border border-outline-variant/30 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-outline-variant/30 text-left">
                <Link href="/news" className="inline-flex items-center gap-2 px-8 py-3 bg-surface border-2 border-outline-variant/50 text-on-surface font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-primary hover:text-on-primary hover:border-primary transition-all hover:-translate-y-1">
                  Back to News
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 lg:mt-[4.5rem] w-full min-w-0 sticky top-32 h-max">
            <aside className="w-full bg-surface-container-low border border-outline-variant/30 rounded-3xl p-1 shadow-sm">
              <div className="p-4 flex items-center justify-between border-b border-outline-variant/30 mx-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-primary"></span>
                  Recent News
                </div>
              </div>
            
            <div className="flex flex-col flex-1">
              {recentPosts.length === 0 ? (
                <div className="p-5 text-sm text-on-surface-variant">No other recent news available.</div>
              ) : (
                recentPosts.map((recentPost: any, index: number) => (
                  <Link 
                    key={recentPost._id.toString()} 
                    href={`/news/${recentPost.slug}`}
                    className={`flex gap-4 p-5 transition-all group relative flex-1 items-center ${index !== recentPosts.length - 1 ? 'border-b border-outline-variant/20' : ''} hover:bg-surface-container-high/50 first:rounded-t-none last:rounded-b-3xl`}
                  >
                    <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container-high shadow-sm">
                      {recentPost.coverImageUrl ? (
                        <Image 
                          src={recentPost.coverImageUrl} 
                          alt={recentPost.title} 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-primary/20 text-primary text-[10px] font-display uppercase tracking-wider text-center">
                          {recentPost.category || 'News'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 h-full justify-center pr-6">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5 truncate">
                        {recentPost.category || 'News'}
                      </span>
                      <h3 className="text-sm md:text-base font-display font-bold text-on-surface leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {recentPost.title}
                      </h3>
                      <div className="mt-auto">
                        <span className="text-[10px] font-semibold text-on-surface-variant">
                          {formatDate(recentPost.publishedAt || recentPost.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-colors shadow-sm">
                      <ChevronRight size={14} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </aside>
          </div>
          
        </div>
      </div>

      <Footer />
    </div>
  );
}
