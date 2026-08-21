import type { MetadataRoute } from "next";
import connectToDatabase from "@/lib/mongodb";
import { Post, GalleryFolder } from "@/models";
import { siteConfig } from "@/lib/constants";
import { LOCALES } from "@/lib/seo";

// Queries the DB for posts/albums, so this can't be statically generated at
// build time (same reason gallery/news pages use this) — it also means the
// sitemap always reflects live content instead of a stale build-time snapshot.
export const dynamic = "force-dynamic";

type StaticPath = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const STATIC_PATHS: StaticPath[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.7 },
  { path: "/news", changeFrequency: "daily", priority: 0.9 },
];

// One entry per locale for a given locale-agnostic path, each carrying
// hreflang alternates pointing at its siblings — same shape the per-page
// `alternates.languages` metadata uses, just inlined here for the sitemap.
function localizedEntries(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified?: Date
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `${siteConfig.url}/${l}${path}`]));
  return LOCALES.map((locale) => ({
    url: `${siteConfig.url}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();
  const [posts, folders] = await Promise.all([
    Post.find({ status: "published" }).select("slug updatedAt").lean(),
    GalleryFolder.find().select("_id updatedAt").lean(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((p) =>
    localizedEntries(p.path, p.changeFrequency, p.priority)
  );

  for (const post of posts) {
    entries.push(...localizedEntries(`/news/${post.slug}`, "monthly", 0.6, post.updatedAt));
  }
  for (const folder of folders) {
    entries.push(...localizedEntries(`/gallery/${folder._id}`, "monthly", 0.5, folder.updatedAt));
  }

  return entries;
}
