import { Post } from '@/models';

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Slugs are unique in the schema, and titles repeat year to year
 * ("Annual Prize Giving"), so collisions are expected rather than exceptional.
 * `excludeId` lets an edit keep its own existing slug.
 */
export async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title) || 'post';
  let candidate = base;
  let n = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Post.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return candidate;
    candidate = `${base}-${n++}`;
  }
}
