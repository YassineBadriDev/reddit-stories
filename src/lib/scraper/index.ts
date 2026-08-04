import { config } from "@/lib/config";
import { cacheGet, cacheSet } from "./cache";
import {
  listingUrl,
  commentsUrl,
  parseListing,
  parseCommentsListing,
  normalizePost,
  isReadablePost,
} from "./reddit";
import { fetchMirrorListing, fetchMirrorPost, fetchMirrorComments } from "./mirror";
import { fetchJsonEscalated } from "@scraper-native";
import { snapshotGet, snapshotSet, SNAPSHOT_STORIES_KEY } from "@/lib/snapshot";
import type { RedditListing, Story, StoryComment, StoryDetail } from "./types";

export async function fetchStories(options?: {
  subreddits?: string[];
  sort?: "top" | "hot" | "new";
  limit?: number;
  force?: boolean;
}): Promise<Story[]> {
  const subreddits = options?.subreddits?.length
    ? options.subreddits
    : config.subreddits;
  const sort = options?.sort ?? config.defaultSort;
  const limit = options?.limit ?? config.defaultLimit;

  const isDefaultFeed =
    subreddits.join(",") === config.subreddits.join(",") &&
    sort === config.defaultSort &&
    limit === config.defaultLimit;

  const cacheKey = `stories:${subreddits.join(",")}:${sort}:${limit}`;

  if (!options?.force) {
    const cached = await cacheGet<Story[]>(cacheKey);
    if (cached) return cached;
    if (isDefaultFeed) {
      const snap = await snapshotGet<Story[]>(SNAPSHOT_STORIES_KEY);
      if (snap) {
        void cacheSet(cacheKey, snap);
        return snap;
      }
    }
  }

  const mirrorOnly = config.scraperSource === "mirror";
  const results = await Promise.allSettled(
    subreddits.map(async (sub) => {
      if (mirrorOnly) {
        return parseListing(await fetchMirrorListing(sub, sort, limit));
      }
      try {
        return parseListing(
          await fetchJsonEscalated<RedditListing>(listingUrl(sub, sort, limit))
        );
      } catch (error) {
        if (config.scraperSource === "reddit") throw error;
        return parseListing(await fetchMirrorListing(sub, sort, limit));
      }
    })
  );

  const stories: Story[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      stories.push(...result.value);
    }
  }

  const seen = new Set<string>();
  const unique = stories
    .sort((a, b) => b.score - a.score)
    .filter((story) => {
      if (seen.has(story.id)) return false;
      seen.add(story.id);
      return true;
    })
    .slice(0, limit * 2);

  if (unique.length > 0) {
    await cacheSet(cacheKey, unique);
    if (isDefaultFeed) {
      await snapshotSet(SNAPSHOT_STORIES_KEY, unique);
    }
  }
  return unique;
}

export async function fetchStoryById(
  id: string,
  options?: { force?: boolean }
): Promise<StoryDetail> {
  const cacheKey = `story:${id}`;

  if (!options?.force) {
    const cached = await cacheGet<StoryDetail>(cacheKey);
    if (cached) return cached;
    const snap = await snapshotGet<StoryDetail>(`story:${id}`);
    if (snap) {
      void cacheSet(cacheKey, snap);
      return snap;
    }
  }

  const unavailable: StoryDetail = {
    story: {
      id,
      title: "Story not available",
      selftext: "This reddit story could not be loaded right now.",
      excerpt: "This reddit story could not be loaded right now.",
      author: "unknown",
      score: 0,
      comments: 0,
      subreddit: "unknown",
      createdAt: new Date().toISOString(),
      url: `/story/${id}`,
      redditUrl: `https://www.reddit.com/comments/${id}`,
      permalink: `/comments/${id}`,
      slug: "story-not-available",
      over18: false,
      isSelf: true,
    },
    comments: [],
  };

  let post;
  let comments: StoryComment[] = [];
  try {
    const mirrorOnly = config.scraperSource === "mirror";
    if (mirrorOnly) {
      post = await fetchMirrorPost(id);
      comments = await fetchMirrorComments(id);
    } else {
      try {
        const body = await fetchJsonEscalated<[RedditListing, RedditListing]>(
          commentsUrl(id)
        );
        const postListing = body?.[0];
        const commentsListing = body?.[1];
        post = postListing?.data?.children?.[0]?.data;
        comments = commentsListing ? parseCommentsListing(commentsListing) : [];
      } catch (error) {
        if (config.scraperSource === "reddit") throw error;
        post = await fetchMirrorPost(id);
        comments = await fetchMirrorComments(id);
      }
    }
  } catch {
    return unavailable;
  }

  const story = post && isReadablePost(post) ? normalizePost(post) : undefined;
  if (!story) return unavailable;

  const detail: StoryDetail = { story, comments };
  await cacheSet(cacheKey, detail);
  await snapshotSet(`story:${id}`, detail);
  return detail;
}

export function flattenComments(comments: StoryComment[]): StoryComment[] {
  const flat: StoryComment[] = [];
  const walk = (items: StoryComment[]) => {
    for (const item of items) {
      flat.push(item);
      walk(item.replies);
    }
  };
  walk(comments);
  return flat;
}
