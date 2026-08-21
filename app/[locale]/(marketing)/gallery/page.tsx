import connectToDatabase from "@/lib/mongodb";
import { GalleryFolder } from "@/models";
import GalleryClientPage from "./GalleryClientPage";
import Footer from "@/components/landing/layout/Footer";
import { localeAlternates, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const title = "Gallery | KCSC";
const description = "View all photo albums from Kallar Central Sports Club.";

export const metadata = {
  title,
  description,
  alternates: localeAlternates("/gallery"),
  openGraph: { title, description, type: "website", images: [DEFAULT_OG_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE.url] },
};

export default async function GalleryPage() {
  const locale = await getLocale();
  const t = await getTranslations("GalleryPage");
  const jsonLd = breadcrumbJsonLd(locale, [
    { name: t("home"), path: "" },
    { name: t("gallery"), path: "/gallery" },
  ]);

  await connectToDatabase();
  const rawFolders = await GalleryFolder.find()
    .select("name coverImageUrl images")
    .sort({ createdAt: -1 })
    .lean();

  const folders = rawFolders.map((folder: any) => ({
    ...folder,
    _id: folder._id?.toString(),
    images: folder.images?.map((img: any) => ({
      ...img,
      _id: img._id?.toString(),
    })) || []
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GalleryClientPage folders={folders} />
      <Footer />
    </>
  );
}
