import connectToDatabase from "@/lib/mongodb";
import { GalleryFolder } from "@/models";
import GalleryClientPage from "./GalleryClientPage";
import Footer from "@/components/landing/layout/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery | KCSC",
  description: "View all photo albums from Kallar Central Sports Club.",
};

export default async function GalleryPage() {
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
      <GalleryClientPage folders={folders} />
      <Footer />
    </>
  );
}
