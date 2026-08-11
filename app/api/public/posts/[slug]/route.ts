import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Post } from '@/models';

/** Single published post by slug, for the landing page's article view. */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectToDatabase();
    const { slug } = await context.params;

    const post = await Post.findOne({ slug, status: 'published' });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
