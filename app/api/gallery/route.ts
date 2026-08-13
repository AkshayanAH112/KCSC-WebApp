import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryImage } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Two-step upload, same as Post cover/gallery images: file goes to POST /api/upload
 *  (folder: 'gallery') first, then the returned url/publicId land here. */
export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    if (!data.url) return NextResponse.json({ error: 'Image url is required' }, { status: 400 });

    const image = await GalleryImage.create({
      url: data.url,
      publicId: data.publicId,
      caption: data.caption,
    });
    return NextResponse.json({ image }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
