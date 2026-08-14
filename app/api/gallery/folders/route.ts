import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder, GalleryImage } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    
    // Automatic Migration: check if there are legacy images and no folders
    const legacyCount = await GalleryImage.countDocuments();
    const folderCount = await GalleryFolder.countDocuments();
    
    if (legacyCount > 0 && folderCount === 0) {
      const legacyImages = await GalleryImage.find().sort({ createdAt: -1 });
      const firstImage = legacyImages[0];
      await GalleryFolder.create({
        name: 'Archived Photos',
        coverImageUrl: firstImage?.url,
        coverImagePublicId: firstImage?.publicId,
        images: legacyImages.map(img => ({
          url: img.url,
          publicId: img.publicId,
          caption: img.caption,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        }))
      });
    }

    const folders = await GalleryFolder.find().sort({ createdAt: -1 });
    return NextResponse.json({ folders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });

    const folder = await GalleryFolder.create({
      name: data.name,
      coverImageUrl: data.coverImageUrl,
      coverImagePublicId: data.coverImagePublicId,
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A folder with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
