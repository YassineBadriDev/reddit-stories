import { config } from "@/lib/config";
import { ScraperError } from "./types";
import type { RedditListing, RedditPost, StoryComment } from "./types";

type Sort = "top" | "hot" | "new";
type MirrorProvider = "arctic-shift" | "pullpush";

interface MirrorPost {
  id: string;
  title: string;
  selftext?: string;
  selftext_html?: string | null;
  author?: string;
  score?: number;
  num_comments?: number;
  subreddit?: string;
  created_utc?: number;
  permalink?: string;
  url?: string;
  over_18?: boolean;
  is_self?: boolean;
  stickied?: boolean;
  removed_by_category?: string | null;
  spoiler?: boolean;
  link_flair_text?: string | null;
}

interface MirrorComment {
  id: string;
  author?: string;
  body?: string;
  score?: number;
  created_utc?: number;
  parent_id?: string;
  link_id?: string;
}

const ARCTIC_BASE = "https://arctic-shift.photon-reddit.com";
const PULLPUSH_BASE = "https://api.pullpush.io";

async function fetchJson<T>(url: string, retries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": config.redditUserAgent,
          accept: "application/json",
        },
      });
    } catch {
      throw new ScraperError("network", `Mirror request failed: ${url}`);
    } finally {
      clearTimeout(timer);
    }
    if (response.ok) {
      try {
        return (await response.json()) as T;
      } catch {
        throw new ScraperError("parse", "Mirror response was not valid JSON");
      }
    }
    if (response.status === 404) {
      throw new ScraperError("not_found", `Mirror not found (${response.status})`);
    }
    // Arctic Shift and PullPush rate limit bursts; back off and retry a few
    // times before failing over to the other provider.
    if (response.status === 429 && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      continue;
    }
    if (response.status === 429) {
      throw new ScraperError("rate_limited", `Mirror rate limited (${response.status})`);
    }
    throw new ScraperError("network", `Mirror status ${response.status}`);
  }
}

function postsUrl(
  provider: MirrorProvider,
  subreddit: string,
  sort: Sort,
  limit: number
): string {
  if (provider === "arctic-shift") {
    return `${ARCTIC_BASE}/api/posts/search?subreddit=${encodeURIComponent(
      subreddit
    )}&limit=${limit}&sort=desc&sort_type=created_utc`;
  }
  const sortType = sort === "new" ? "created_utc" : "score";
  return `${PULLPUSH_BASE}/reddit/search/submission/?subreddit=${encodeURIComponent(
    subreddit
  )}&size=${limit}&sort=desc&sort_type=${sortType}`;
}

function postsByIdUrl(provider: MirrorProvider, id: string): string {
  if (provider === "arctic-shift") {
    return `${ARCTIC_BASE}/api/posts/ids?ids=${encodeURIComponent(id)}`;
  }
  return `${PULLPUSH_BASE}/reddit/search/submission/?ids=${encodeURIComponent(id)}`;
}

function commentsUrl(provider: MirrorProvider, id: string): string {
  if (provider === "arctic-shift") {
    return `${ARCTIC_BASE}/api/comments/search?link_id=t3_${encodeURIComponent(
      id
    )}&limit=100`;
  }
  return `${PULLPUSH_BASE}/reddit/comments/search?link_id=t3_${encodeURIComponent(
    id
  )}&size=100`;
}

function providerOrder(): MirrorProvider[] {
  const primary = config.mirrorProvider === "pullpush" ? "pullpush" : "arctic-shift";
  const secondary: MirrorProvider =
    primary === "arctic-shift" ? "pullpush" : "arctic-shift";
  return [primary, secondary];
}

function normalizePost(post: MirrorPost, fallbackSubreddit: string): RedditPost {
  const id = String(post.id ?? "");
  return {
    id,
    title: post.title ?? "",
    selftext: post.selftext ?? "",
    selftext_html: post.selftext_html ?? null,
    author: post.author ?? "[deleted]",
    score: post.score ?? 0,
    num_comments: post.num_comments ?? 0,
    subreddit: post.subreddit ?? fallbackSubreddit,
    created_utc: post.created_utc ?? 0,
    permalink: post.permalink ?? `/comments/${id}/`,
    url: post.url ?? "",
    over_18: Boolean(post.over_18),
    is_self: post.is_self !== false,
    stickied: Boolean(post.stickied),
    removed_by_category: post.removed_by_category ?? null,
    spoiler: Boolean(post.spoiler),
    link_flair_text: post.link_flair_text ?? null,
  };
}

function toListing(posts: MirrorPost[], fallbackSubreddit: string): RedditListing {
  return {
    kind: "Listing",
    data: {
      children: posts.map((post) => ({
        kind: "t3",
        data: normalizePost(post, fallbackSubreddit),
      })),
      after: null,
      before: null,
    },
  };
}

export async function fetchMirrorListing(
  subreddit: string,
  sort: Sort,
  limit: number
): Promise<RedditListing> {
  const fetchLimit =
    sort === "top" || sort === "hot"
      ? Math.min(Math.max(limit * 2, 30), 100)
      : Math.min(limit, 100);
  const wanted = sort === "top" || sort === "hot" ? limit : fetchLimit;

  let lastError: unknown;
  for (const provider of providerOrder()) {
    try {
      const data = await fetchJson<{ data: MirrorPost[] }>(
        postsUrl(provider, subreddit, sort, fetchLimit)
      );
      const posts = Array.isArray(data?.data) ? data.data : [];
      if (posts.length === 0) continue;
      const sorted =
        sort === "top" || sort === "hot"
          ? [...posts].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          : posts;
      return toListing(sorted.slice(0, wanted), subreddit);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new ScraperError("network", "Mirror providers unavailable");
}

export async function fetchMirrorPost(id: string): Promise<RedditPost | null> {
  let lastError: unknown;
  for (const provider of providerOrder()) {
    try {
      const data = await fetchJson<{ data: MirrorPost[] }>(
        postsByIdUrl(provider, id)
      );
      const posts = Array.isArray(data?.data) ? data.data : [];
      const post = posts.find((p) => String(p.id) === id) ?? posts[0];
      if (!post) return null;
      return normalizePost(post, post.subreddit ?? "unknown");
    } catch (error) {
      if (error instanceof ScraperError && error.code === "not_found") return null;
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

export async function fetchMirrorComments(id: string): Promise<StoryComment[]> {
  let lastError: unknown;
  for (const provider of providerOrder()) {
    try {
      const data = await fetchJson<{ data: MirrorComment[] }>(
        commentsUrl(provider, id)
      );
      const comments = Array.isArray(data?.data) ? data.data : [];
      if (comments.length === 0) return [];
      return buildCommentTree(comments);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new ScraperError("network", "Mirror providers unavailable");
}

export function buildCommentTree(comments: MirrorComment[]): StoryComment[] {
  const nodes = new Map<string, StoryComment>();
  for (const comment of comments) {
    if (!comment.id) continue;
    nodes.set(comment.id, {
      id: comment.id,
      author: comment.author ?? "[deleted]",
      body: comment.body ?? "",
      score: comment.score ?? 0,
      createdAt: new Date((comment.created_utc ?? 0) * 1000).toISOString(),
      depth: 0,
      replies: [],
    });
  }

  const roots: StoryComment[] = [];
  const children = new Map<string, StoryComment[]>();
  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;
    const parentId =
      comment.parent_id && comment.parent_id.startsWith("t1_")
        ? comment.parent_id.slice(3)
        : null;
    if (parentId && nodes.has(parentId)) {
      const siblings = children.get(parentId) ?? [];
      siblings.push(node);
      children.set(parentId, siblings);
    } else {
      roots.push(node);
    }
  }

  const walk = (node: StoryComment, depth: number) => {
    node.depth = depth;
    node.replies = children.get(node.id) ?? [];
    for (const reply of node.replies) walk(reply, depth + 1);
  };
  for (const root of roots) walk(root, 0);

  const clean: StoryComment[] = [];
  const push = (node: StoryComment) => {
    if (node.author === "[deleted]") return;
    if (node.depth >= 6) return;
    node.replies = node.replies.filter(
      (reply) => reply.author !== "[deleted]" && reply.depth < 6
    );
    clean.push(node);
  };
  for (const root of roots) push(root);
  return clean;
}
