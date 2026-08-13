import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Post, POST_CATEGORIES } from '@/models';

/**
 * Public feed for the club's landing page (a separate project).
 *
 * Read-only, published posts only, no auth. next.config.ts already serves /api/*
 * with Access-Control-Allow-Origin: *, so the landing page can fetch this from
 * any origin without further configuration.
 *
 * GET /api/public/posts?category=news&limit=6&page=1
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const limit = Math.min(Number(searchParams.get('limit')) || 12, 50);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);

    const query: Record<string, unknown> = { status: 'published' };
    if (category && POST_CATEGORIES.includes(category as any)) query.category = category;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .select('title slug excerpt content coverImageUrl images category tags author publishedAt createdAt')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
