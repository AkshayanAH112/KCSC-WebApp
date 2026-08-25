/**
 * The single source of truth for post categories.
 *
 * This lives in lib/ rather than in models/index.ts because the admin editor
 * and the public news page are both client components: importing the list from
 * models/ would pull mongoose into the browser bundle. models/index.ts imports
 * from here and re-exports, so `import { POST_CATEGORIES } from "@/models"`
 * keeps working for the API routes.
 *
 * Adding a category means adding it here and adding a `topic_<value>` string
 * to messages/en.json and messages/ta.json — the admin select, the public
 * filter chips and the Mongo enum all derive from this array. Values are
 * persisted on every Post and appear in `?category=` query strings, so treat
 * them as stable: relabel freely, but renaming a value orphans existing posts.
 */
export const POST_CATEGORIES = [
  "news",
  "blog",
  "event",
  "achievement",
  "match",
  "community",
  "education",
  "announcement",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

/**
 * Labels for the admin console, which is English-only. The public site does
 * not use these — it translates via the `topic_<value>` message keys so the
 * chips render in the visitor's language.
 */
export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  news: "News",
  blog: "Blog",
  event: "Event",
  achievement: "Achievement",
  match: "Match Report",
  community: "Community Service",
  education: "Education",
  announcement: "Announcement",
};

/** Falls back to the raw stored value, so a post saved under a category that
 *  was later removed still renders something readable instead of blank. */
export function postCategoryLabel(value: string): string {
  return POST_CATEGORY_LABELS[value as PostCategory] ?? value;
}
