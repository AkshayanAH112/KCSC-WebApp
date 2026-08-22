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

    const newImage = {
      url: data.url,
      publicId: data.publicId,
      caption: data.caption,
    };

    // Atomic $push instead of findById + mutate + .save(): the gallery upload
    // UI fires every file's attach-to-folder request concurrently (Promise.all
    // over the whole batch), and a read-modify-write here loses that race —
    // Mongoose's optimistic-concurrency check (__v) rejects every save but the
    // first to land, which is exactly what turned "183 images uploaded" into
    // "23 attached, 160 failed with 500s".
    const folder = await GalleryFolder.findByIdAndUpdate(
      id,
      { $push: { images: { $each: [newImage], $position: 0 } } },
      { new: true, runValidators: true }
    );
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    // Only the very first image should become the cover — conditioned on the
    // folder doc itself (not the read above) so this is race-safe too.
    if (!folder.coverImageUrl) {
      await GalleryFolder.updateOne(
        { _id: id, $or: [{ coverImageUrl: { $exists: false } }, { coverImageUrl: null }, { coverImageUrl: '' }] },
        { $set: { coverImageUrl: data.url, coverImagePublicId: data.publicId } }
      );
    }

    const image = folder.images[0];
    return NextResponse.json({ image }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
