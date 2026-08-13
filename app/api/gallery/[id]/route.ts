import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryImage } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';
import { deleteImage } from '@/lib/cloudinary';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const { caption } = await request.json();

    const image = await GalleryImage.findByIdAndUpdate(id, { caption }, { new: true });
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    return NextResponse.json({ image });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const image = await GalleryImage.findByIdAndDelete(id);
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    await deleteImage(image.publicId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
