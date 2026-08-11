import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Post } from '@/models';
import { isAdminRequest } from '@/lib/requireAdmin';
import { uniqueSlug } from '@/lib/slug';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const existing = await Post.findById(id);
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const data = await request.json();
    const update: Record<string, unknown> = { ...data };

    // Retitling changes the public URL, so the slug follows the title.
    if (data.title && data.title !== existing.title) {
      update.slug = await uniqueSlug(data.title, id);
    }

    // Stamp publishedAt on the draft → published transition only; re-editing a
    // live post must not bump it to the top of the club's news feed.
    if (data.status === 'published' && !existing.publishedAt) {
      update.publishedAt = new Date();
    }

    // Images dropped from the post are also removed from Cloudinary, otherwise the
    // account fills with orphaned assets no one can reach.
    if (data.coverImagePublicId !== undefined && existing.coverImagePublicId && data.coverImagePublicId !== existing.coverImagePublicId) {
      await deleteImage(existing.coverImagePublicId);
    }
    if (Array.isArray(data.images)) {
      const keptIds = new Set(data.images.map((img: any) => img.publicId).filter(Boolean));
      const removed = (existing.images ?? []).filter(
        (img: any) => img.publicId && !keptIds.has(img.publicId)
      );
      await Promise.all(removed.map((img: any) => deleteImage(img.publicId)));
    }

    const post = await Post.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    await Promise.all([
      deleteImage(post.coverImagePublicId),
      ...(post.images ?? []).map((img: any) => deleteImage(img.publicId)),
    ]);
    await Post.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
