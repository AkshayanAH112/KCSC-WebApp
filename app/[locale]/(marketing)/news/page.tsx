import connectToDatabase from "@/lib/mongodb";
import { Post } from "@/models";
import NewsClientPage from "./NewsClientPage";
import Footer from "@/components/landing/layout/Footer";
import { localeAlternates, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";

// Reads Post straight from the DB — see app/(marketing)/gallery/page.tsx for why
// this can't be left to statically prerender at build time.
export const dynamic = "force-dynamic";

const title = "All News & Updates | KCSC";
const description = "Read all the latest news, updates, and announcements from Kallar Central Sports Club.";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title,
    description,
    alternates: localeAlternates("/news", locale),
    openGraph: { title, description, type: "website" as const, images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary_large_image" as const, title, description, images: [DEFAULT_OG_IMAGE.url] },
  };
}

export default async function NewsPage() {
  const locale = await getLocale();
  const t = await getTranslations("NewsPage");
  const jsonLd = breadcrumbJsonLd(locale, [
    { name: t("home"), path: "" },
    { name: t("news"), path: "/news" },
  ]);

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NewsClientPage posts={posts} />
      <Footer />
    </>
  );
}
