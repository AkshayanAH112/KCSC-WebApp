import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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

type Props = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <div className="bg-surface-container-lowest min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <div className="mb-8 mt-6">
          <Link 
            href="/news"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ChevronLeft size={16} /> Back to News
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-soft flex flex-col">
          {post.coverImageUrl && (
            <div className="w-full aspect-[21/9] md:aspect-[21/7] relative bg-surface-container-high">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="px-6 py-10 md:px-12 md:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                  {post.category}
                </span>
                <span className="text-sm font-medium text-on-surface-variant">
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4 text-on-surface">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-on-surface-variant font-medium mb-8 leading-relaxed border-l-4 border-primary pl-4">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-lg prose-slate prose-headings:font-display prose-headings:text-on-surface prose-p:text-on-surface-variant prose-a:text-primary max-w-none">
                {post.content.split('\n').map((paragraph: string, idx: number) => {
                  if (!paragraph.trim()) return null; // Skip empty lines between paragraphs
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
