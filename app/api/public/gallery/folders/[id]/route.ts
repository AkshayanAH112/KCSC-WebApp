import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder } from '@/models';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const folder = await GalleryFolder.findById(id).lean();
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    return NextResponse.json({ folder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
