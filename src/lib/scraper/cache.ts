import { mkdir, readFile, writeFile } from "node:fs/promises";
import { config } from "@/lib/config";
import { dataDir, dataFile } from "@/lib/paths";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memory = new Map<string, CacheEntry<unknown>>();
const diskCacheFile = dataFile("cache.json");

let diskLoaded = false;

async function loadDisk(): Promise<void> {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = await readFile(diskCacheFile, "utf8");
    const parsed = JSON.parse(raw) as Record<string, CacheEntry<unknown>>;
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry.expiresAt > Date.now()) {
        memory.set(key, entry);
      }
    }
  } catch {
    // no disk cache yet
  }
}

async function persistDisk(): Promise<void> {
  try {
    await mkdir(dataDir(), { recursive: true });
    const fresh: Record<string, CacheEntry<unknown>> = {};
    for (const [key, entry] of memory.entries()) {
      if (entry.expiresAt > Date.now()) {
        fresh[key] = entry;
      }
    }
    await writeFile(diskCacheFile, JSON.stringify(fresh), "utf8");
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
    await writeFile(diskCacheFile, "{}", "utf8");
  } catch {
    // ignore
  }
}
