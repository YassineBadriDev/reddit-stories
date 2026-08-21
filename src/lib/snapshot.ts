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
// window and cap. `name` is the snapshot key (e.g. the main feed or a
// `category:<slug>` feed).
export async function mergeStoriesIntoSnapshot(
  name: string,
  fresh: Story[]
): Promise<Story[]> {
  const previous = (await readRaw<Story[]>(name))?.data ?? [];
  const byId = new Map<string, Story>();
  for (const story of previous) byId.set(story.id, story);
  for (const story of fresh) byId.set(story.id, story);

  const cutoff = Date.now() - ARCHIVE_MAX_AGE_SECONDS * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const eligible = [...byId.values()].filter(
    (story) => Date.parse(story.createdAt) >= cutoff
  );

  const todayStories = eligible.filter(
    (story) => Date.parse(story.createdAt) >= todayStart.getTime()
  );
  const olderStories = eligible
    .filter((story) => Date.parse(story.createdAt) < todayStart.getTime())
    .sort((a, b) => b.score - a.score);

  const remaining = Math.max(0, ARCHIVE_MAX_STORIES - todayStories.length);
  const merged = [...todayStories, ...olderStories.slice(0, remaining)];

  await snapshotSet(name, merged);
  return merged;
}

// Forces a fresh scrape of the main feed and every category feed and persists
// them as snapshots. Used by the worker's `scheduled` cron trigger and by the
// manual refresh endpoint. Returns the total number of stories stored.
export async function refreshAllSnapshots(): Promise<number> {
  const { fetchStories, fetchCategoryStories } = await import("@/lib/scraper");
  const { categories } = await import("@/lib/categories");

  const tasks = [
    { label: "main", run: () => fetchStories({ force: true }) },
    ...categories.map((category) => ({
      label: category.slug,
      run: () => fetchCategoryStories(category, { force: true }),
    })),
  ];

  // Scrape in small, paced batches to avoid tripping the mirror APIs' rate
  // limits (a burst of parallel fetches gets 429'd).
  const counts = await mapLimit(tasks, 2, async (task) => {
    const count = await task
      .run()
      .then((stories) => stories.length)
      .catch(() => 0);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return count;
  });
  return counts.reduce((total, count) => total + count, 0);
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        const i = index++;
        results[i] = await fn(items[i]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
