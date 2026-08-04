import storage from "@snapshot-storage";

// Daily snapshot: scraped once per day (by the worker's cron trigger or a
// scheduled request) and served from durable storage (Cloudflare KV on
// Workers, disk elsewhere). Reads fall back to a fresh scrape only when a
// snapshot is missing or older than SNAPSHOT_TTL_SECONDS.
export const SNAPSHOT_TTL_SECONDS = 24 * 60 * 60;
export const SNAPSHOT_STORIES_KEY = "stories";

interface Snapshot<T> {
  updatedAt: number;
  data: T;
}

export async function snapshotGet<T>(
  name: string,
  ttlSeconds = SNAPSHOT_TTL_SECONDS
): Promise<T | undefined> {
  const raw = await storage.read(name);
  if (!raw) return undefined;
  try {
    const snap = JSON.parse(raw) as Snapshot<T>;
    if (Date.now() - snap.updatedAt > ttlSeconds * 1000) return undefined;
    return snap.data;
  } catch {
    return undefined;
  }
}

export async function snapshotSet<T>(name: string, data: T): Promise<void> {
  const snap: Snapshot<T> = { updatedAt: Date.now(), data };
  try {
    await storage.write(name, JSON.stringify(snap));
  } catch {
    // best-effort
  }
}

// Forces a fresh scrape of the daily feed and persists it as the snapshot.
// Used by the worker's `scheduled` cron trigger and by the manual refresh
// endpoint. Returns the number of stories stored.
export async function refreshDailySnapshot(): Promise<number> {
  const { fetchStories } = await import("@/lib/scraper");
  const stories = await fetchStories({ force: true });
  return stories.length;
}
