import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder } from '@/models';

export async function GET() {
  try {
    await connectToDatabase();
    const folders = await GalleryFolder.find()
      .select('name coverImageUrl images')
      .sort({ createdAt: -1 })
      .lean();
      
    const formattedFolders = folders.map((f: any) => ({
      _id: f._id,
      name: f.name,
      coverImageUrl: f.coverImageUrl,
      imageCount: f.images?.length || 0,
      createdAt: f.createdAt
    }));
      
    return NextResponse.json({ folders: formattedFolders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
