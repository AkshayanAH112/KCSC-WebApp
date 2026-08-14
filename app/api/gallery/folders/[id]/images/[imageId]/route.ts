import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function PATCH(request: Request, context: { params: Promise<{ id: string, imageId: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id, imageId } = await context.params;
    const data = await request.json();

    const folder = await GalleryFolder.findById(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    const image = folder.images.id(imageId);
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    if (data.caption !== undefined) image.caption = data.caption;
    
    if (data.setAsCover) {
      folder.coverImageUrl = image.url;
      folder.coverImagePublicId = image.publicId;
    }

    await folder.save();
    return NextResponse.json({ image });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string, imageId: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id, imageId } = await context.params;

    const folder = await GalleryFolder.findById(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    const image = folder.images.id(imageId);
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    if (folder.coverImageUrl === image.url) {
      const anotherImage = folder.images.find((img: any) => img._id.toString() !== imageId);
      folder.coverImageUrl = anotherImage ? anotherImage.url : undefined;
      folder.coverImagePublicId = anotherImage ? anotherImage.publicId : undefined;
    }

    folder.images.pull(imageId);
    await folder.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
