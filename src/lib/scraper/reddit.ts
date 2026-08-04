import type { RedditCommentChild, RedditListing, RedditPost, Story, StoryComment } from "./types";

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "story";
}

export function toExcerpt(selftext: string, max = 220): string {
  const clean = selftext.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function normalizePost(post: RedditPost): Story {
  const slug = slugify(post.title);
  return {
    id: post.id,
    title: post.title.trim(),
    selftext: post.selftext,
    excerpt: toExcerpt(post.selftext),
    author: post.author,
    score: post.score,
    comments: post.num_comments,
    subreddit: post.subreddit,
    createdAt: new Date(post.created_utc * 1000).toISOString(),
    url: `/story/${post.id}/${slug}`,
    redditUrl: `https://www.reddit.com${post.permalink}`,
    permalink: post.permalink,
    slug,
    over18: post.over_18,
    isSelf: post.is_self,
  };
}

export function isReadablePost(post: RedditPost): boolean {
  if (!post.is_self) return false;
  if (post.over_18) return false;
  if (post.stickied) return false;
  if (post.removed_by_category) return false;
  if (!post.selftext || post.selftext.trim().length < 20) return false;
  if (post.author === "[deleted]") return false;
  return true;
}

export function listingUrl(
  subreddit: string,
  sort: "top" | "hot" | "new",
  limit: number
): string {
  return `https://www.reddit.com/r/${encodeURIComponent(
    subreddit
  )}/${sort}.json?limit=${limit}&raw_json=1`;
}

export function commentsUrl(id: string): string {
  return `https://www.reddit.com/comments/${id}.json?raw_json=1`;
}

export function parseListing(listing: RedditListing): Story[] {
  const children = listing?.data?.children ?? [];
  return children
    .map((child) => child.data)
    .filter(isReadablePost)
    .map(normalizePost);
}

function parseReply(
  reply: RedditCommentChild["data"]["replies"]
): RedditCommentChild[] {
  if (!reply || typeof reply === "string") return [];
  return reply.data?.children ?? [];
}

export function parseCommentTree(
  child: RedditCommentChild,
  depth = 0
): StoryComment | null {
  const data = child?.data;
  if (!data || !data.id || data.author === "[deleted]") return null;
  const nested = parseReply(data.replies)
    .map((reply) => parseCommentTree(reply, depth + 1))
    .filter((c): c is StoryComment => c !== null);
  return {
    id: data.id,
    author: data.author,
    body: data.body ?? "",
    score: data.score ?? 0,
    createdAt: new Date((data.created_utc ?? 0) * 1000).toISOString(),
    depth,
    replies: nested,
  };
}

export function parseCommentsListing(
  listing: RedditListing
): StoryComment[] {
  const children = listing?.data?.children ?? [];
  return children
    .map((child) => parseCommentTree(child as unknown as RedditCommentChild))
    .filter((c): c is StoryComment => c !== null)
    .filter((c) => c.depth < 6);
}
