import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import connectToDatabase from "@/lib/mongodb";
import { GalleryFolder } from "@/models";
import LightboxGallery from "@/components/landing/LightboxGallery";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  try {
    const folder = await GalleryFolder.findById(id).select("name").lean();
    if (!folder) return { title: "Album Not Found | KCSC" };
    return {
      title: `${folder.name} | Gallery | KCSC`,
      description: `View photos from ${folder.name} at Kallar Central Sports Club.`,
    };
  } catch (e) {
    return { title: "Gallery | KCSC" };
  }
}

export default async function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const { id } = await params;
  
  let folder;
  try {
    folder = await GalleryFolder.findById(id).lean();
  } catch (e) {
    // Invalid ObjectId format, etc.
  }

  if (!folder) {
    notFound();
  }

  // Convert MongoDB ObjectIds to strings for Client Component
  const images = folder.images.map((img: any) => ({
    _id: img._id.toString(),
    url: img.url,
    caption: img.caption,
  }));

  return (
    <div className="bg-surface-container-lowest min-h-screen pt-24 pb-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16">
        <div className="mb-8 mt-6">
          <Link 
            href="/gallery"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ChevronLeft size={16} /> Back to Albums
          </Link>
        </div>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-on-surface mb-4">{folder.name}</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
          </p>
        </div>

        <LightboxGallery images={images} />
      </div>
    </div>
  );
}
