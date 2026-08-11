import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Post, POST_CATEGORIES } from '@/models';
import { isAdminRequest } from '@/lib/requireAdmin';
import { uniqueSlug } from '@/lib/slug';

/** Admin listing — includes drafts, so it is behind the auth guard. */
export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const query: Record<string, unknown> = {};
    if (status === 'draft' || status === 'published') query.status = status;
    if (category && POST_CATEGORIES.includes(category as any)) query.category = category;

    const posts = await Post.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const data = await request.json();
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!data.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await Post.create({
      ...data,
      slug: await uniqueSlug(data.title),
      // publishedAt is the date the landing page sorts and displays by, so it is
      // stamped when the post first goes live, not when the row was created.
      publishedAt: data.status === 'published' ? new Date() : undefined,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
