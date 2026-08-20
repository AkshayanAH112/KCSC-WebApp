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
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        {/* Header matched to screenshot style */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-on-surface max-w-lg leading-tight tracking-tight">
            Club moments and<br className="hidden md:block"/> memories.
          </h1>
          <p className="text-base text-on-surface-variant max-w-md md:text-right pb-2">
            Explore our albums featuring memorable matches, behind-the-scenes action, and celebrations from Kallar Central Sports Club.
          </p>
        </div>

        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No gallery albums uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder: any, idx: number) => {
              const imageCount = folder.images?.length || 0;
              return (
                <Link 
                  key={folder._id?.toString() || idx} 
                  href={`/gallery/${folder._id}`}
                  className="group relative rounded-[2rem] overflow-hidden bg-surface-container shadow-soft hover:shadow-elevated transition-all duration-300 block h-[400px]"
                >
                  {folder.coverImageUrl ? (
                    <Image 
                      src={folder.coverImageUrl} 
                      alt={folder.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-variant/20">
                      <FolderIcon className="w-16 h-16 text-on-surface-variant/30" />
                    </div>
                  )}

                  {/* Top-left pill */}
                  <div className="absolute top-5 left-5 z-10">
                    <div className="backdrop-blur-md bg-black/40 border border-white/20 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm drop-shadow-md">
                      {imageCount} {imageCount === 1 ? 'Photo' : 'Photos'}
                    </div>
                  </div>
                  
                  {/* Bottom Gradient & Text */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6 flex flex-col justify-end pt-32 pb-7">
                    <h3 className="text-white text-xl font-display font-medium mb-1 group-hover:text-primary transition-colors drop-shadow-lg">
                      {folder.name}
                    </h3>
                    <p className="text-white/90 text-[13px] font-medium tracking-wide drop-shadow-md">
                      Cricket & Community | KCSC
                    </p>
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
