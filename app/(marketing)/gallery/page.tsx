import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Folder as FolderIcon } from "lucide-react";
import connectToDatabase from "@/lib/mongodb";
import { GalleryFolder } from "@/models";

// This reads GalleryFolder straight from the DB (no API route in between), so
// without this it would statically prerender at build time and freeze gallery
// content until the next deploy — admin-published albums must show up live.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery | KCSC",
  description: "View all photo albums from Kallar Central Sports Club.",
};

export default async function GalleryPage() {
  await connectToDatabase();
  const folders = await GalleryFolder.find()
    .select("name coverImageUrl images")
    .sort({ createdAt: -1 })
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
          <h1 className="text-4xl md:text-5xl font-display font-bold text-on-surface mb-4">Gallery</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Explore our albums featuring moments, matches, and memories from the ground.
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-on-surface-variant">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No gallery albums uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder: any, idx: number) => {
              const imageCount = folder.images?.length || 0;
              return (
                <Link 
                  key={idx} 
                  href={`/gallery/${folder._id}`}
                  className="group relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 shadow-soft hover:shadow-elevated transition-all duration-300 aspect-[4/3] block"
                >
                  {folder.coverImageUrl ? (
                    <Image 
                      src={folder.coverImageUrl} 
                      alt={folder.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-variant/20">
                      <FolderIcon className="w-16 h-16 text-on-surface-variant/30" />
                    </div>
                  )}
                  
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-end h-1/2">
                    <h3 className="text-white text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{folder.name}</h3>
                    <p className="text-white/80 text-sm font-medium">{imageCount} {imageCount === 1 ? 'Photo' : 'Photos'}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
