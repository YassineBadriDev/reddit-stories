import storage from "@snapshot-storage";
import type { Story } from "./scraper/types";

// Rolling snapshot of the feed: scraped twice a day (worker cron at 03:00 and
// 15:00 UTC) and served from durable storage (Cloudflare KV on Workers, disk
// elsewhere). Stories that fall out of the top feed stay in the archive until
// they are older than ARCHIVE_MAX_AGE_SECONDS or the ARCHIVE_MAX_STORIES cap
// is exceeded, then they are pruned. Reads fall back to a fresh scrape only
// when the snapshot is missing or older than SNAPSHOT_TTL_SECONDS.
export const SNAPSHOT_TTL_SECONDS = 24 * 60 * 60;
export const SNAPSHOT_STORIES_KEY = "stories";
export const ARCHIVE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const ARCHIVE_MAX_STORIES = 500;

interface Snapshot<T> {
  updatedAt: number;
  data: T;
}

async function readRaw<T>(name: string): Promise<Snapshot<T> | undefined> {
  const raw = await storage.read(name);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Snapshot<T>;
  } catch {
    return undefined;
  }
}

export async function snapshotGet<T>(
  name: string,
  ttlSeconds = SNAPSHOT_TTL_SECONDS
): Promise<T | undefined> {
  const snap = await readRaw<T>(name);
  if (!snap) return undefined;
  if (Date.now() - snap.updatedAt > ttlSeconds * 1000) return undefined;
  return snap.data;
}

export async function snapshotSet<T>(name: string, data: T): Promise<void> {
  const snap: Snapshot<T> = { updatedAt: Date.now(), data };
  try {
    await storage.write(name, JSON.stringify(snap));
  } catch {
    // best-effort
  }
}

// Merges a fresh scrape of the feed into the stored archive and returns the
// merged list (fresh stories plus retained older ones), pruned to the rolling
// window and cap.
export async function mergeStoriesIntoSnapshot(fresh: Story[]): Promise<Story[]> {
  const previous = (await readRaw<Story[]>(SNAPSHOT_STORIES_KEY))?.data ?? [];
  const byId = new Map<string, Story>();
  for (const story of previous) byId.set(story.id, story);
  for (const story of fresh) byId.set(story.id, story);

  const cutoff = Date.now() - ARCHIVE_MAX_AGE_SECONDS * 1000;
  const merged = [...byId.values()]
    .filter((story) => Date.parse(story.createdAt) >= cutoff)
    .sort((a, b) => b.score - a.score)
    .slice(0, ARCHIVE_MAX_STORIES);

  await snapshotSet(SNAPSHOT_STORIES_KEY, merged);
  return merged;
}

// Forces a fresh scrape of the daily feed and persists it as the snapshot.
// Used by the worker's `scheduled` cron trigger and by the manual refresh
// endpoint. Returns the number of stories stored.
export async function refreshDailySnapshot(): Promise<number> {
  const { fetchStories } = await import("@/lib/scraper");
  const stories = await fetchStories({ force: true });
  return stories.length;
}
