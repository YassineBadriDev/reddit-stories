import { config } from "@/lib/config";
import { storageRead, storageWrite } from "@/lib/storage";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memory = new Map<string, CacheEntry<unknown>>();
const diskCacheFile = "cache.json";

let diskLoaded = false;

async function loadDisk(): Promise<void> {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = await storageRead(diskCacheFile);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry<unknown>>;
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry.expiresAt > Date.now()) {
        memory.set(key, entry);
      }
    }
  } catch {
    // no persisted cache yet
  }
}

async function persistDisk(): Promise<void> {
  try {
    const fresh: Record<string, CacheEntry<unknown>> = {};
    for (const [key, entry] of memory.entries()) {
      if (entry.expiresAt > Date.now()) {
        fresh[key] = entry;
      }
    }
    await storageWrite(diskCacheFile, JSON.stringify(fresh));
  } catch {
    // persistence is best-effort
  }
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  await loadDisk();
  const entry = memory.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return entry.value;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = config.cacheTtlSeconds
): Promise<void> {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  void persistDisk();
}

export async function cacheClear(): Promise<void> {
  memory.clear();
  diskLoaded = false;
  try {
    await storageWrite(diskCacheFile, "{}");
  } catch {
    // ignore
  }
}
