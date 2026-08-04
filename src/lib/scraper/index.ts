import { config } from "@/lib/config";
import { httpGetJson } from "./http";
import { browserGetJson } from "./browser";
import { cacheGet, cacheSet } from "./cache";
import { ScraperError } from "./types";
import {
  listingUrl,
  commentsUrl,
  parseListing,
  parseCommentsListing,
  normalizePost,
  isReadablePost,
} from "./reddit";
import { fetchMirrorListing, fetchMirrorPost, fetchMirrorComments } from "./mirror";
import type { RedditListing, Story, StoryComment, StoryDetail } from "./types";

async function fetchJsonEscalated<T>(url: string): Promise<T> {
  const mode = config.scraperMode;
  if (mode === "browser") {
    return browserGetJson<T>(url);
  }
  try {
    return (await httpGetJson<T>(url)).body;
  } catch (error) {
    if (mode === "http") throw error;
    if (
      error instanceof ScraperError &&
      (error.code === "rate_limited" ||
        error.code === "blocked" ||
        error.code === "network")
    ) {
      return browserGetJson<T>(url);
    }
    throw error;
  }
}

export async function fetchStories(options?: {
  subreddits?: string[];
  sort?: "top" | "hot" | "new";
  limit?: number;
}): Promise<Story[]> {
  const subreddits = options?.subreddits?.length
    ? options.subreddits
    : config.subreddits;
  const sort = options?.sort ?? config.defaultSort;
  const limit = options?.limit ?? config.defaultLimit;

  const cacheKey = `stories:${subreddits.join(",")}:${sort}:${limit}`;
  const cached = await cacheGet<Story[]>(cacheKey);
  if (cached) return cached;

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
  }
  return unique;
}

export async function fetchStoryById(id: string): Promise<StoryDetail> {
  const cacheKey = `story:${id}`;
  const cached = await cacheGet<StoryDetail>(cacheKey);
  if (cached) return cached;

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
