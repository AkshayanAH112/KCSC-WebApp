import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryImage } from '@/models';

/**
 * Public read-only feed for the landing page's Gallery section
 * (components/landing/Gallery.tsx). No auth, published newest-first.
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const images = await GalleryImage.find().select('url caption').sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
