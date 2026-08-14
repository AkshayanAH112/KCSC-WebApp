import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();
    if (!data.url) return NextResponse.json({ error: 'Image url is required' }, { status: 400 });

    const folder = await GalleryFolder.findById(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    const newImage = {
      url: data.url,
      publicId: data.publicId,
      caption: data.caption,
    };
    folder.images.unshift(newImage);
    
    if (!folder.coverImageUrl) {
      folder.coverImageUrl = data.url;
      folder.coverImagePublicId = data.publicId;
    }
    
    await folder.save();
    
    const image = folder.images[0];
    return NextResponse.json({ image }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
