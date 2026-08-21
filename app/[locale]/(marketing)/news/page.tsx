import connectToDatabase from "@/lib/mongodb";
import { Post } from "@/models";
import NewsClientPage from "./NewsClientPage";
import Footer from "@/components/landing/layout/Footer";

// Reads Post straight from the DB — see app/(marketing)/gallery/page.tsx for why
// this can't be left to statically prerender at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "All News & Updates | KCSC",
  description: "Read all the latest news, updates, and announcements from Kallar Central Sports Club.",
};

export default async function NewsPage() {
  await connectToDatabase();
  const rawPosts = await Post.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  // Serialize _id for Client Component
  const posts = rawPosts.map((post: any) => ({
    ...post,
    _id: post._id.toString(),
  }));

  return (
    <>
      <NewsClientPage posts={posts} />
      <Footer />
    </>
  );
}
