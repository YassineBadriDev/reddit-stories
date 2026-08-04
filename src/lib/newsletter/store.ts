import { storageRead, storageWrite } from "@/lib/storage";

export interface Subscriber {
  email: string;
  createdAt: string;
  subscribed: boolean;
}

let cached: Subscriber[] | null = null;

async function load(): Promise<Subscriber[]> {
  if (cached) return cached;
  try {
    const raw = await storageRead("subscribers.json");
    cached = raw ? (JSON.parse(raw) as Subscriber[]) : [];
  } catch {
    cached = [];
  }
  return cached;
}

async function save(list: Subscriber[]): Promise<void> {
  cached = list;
  await storageWrite("subscribers.json", JSON.stringify(list, null, 2));
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const list = await load();
  return list.filter((s) => s.subscribed);
}

export async function addSubscriber(email: string): Promise<boolean> {
  const list = await load();
  const normalized = email.trim().toLowerCase();
  const existing = list.find((s) => s.email === normalized);
  if (existing) {
    if (existing.subscribed) return false;
    existing.subscribed = true;
    existing.createdAt = new Date().toISOString();
  } else {
    list.push({
      email: normalized,
      createdAt: new Date().toISOString(),
      subscribed: true,
    });
  }
  await save(list);
  return true;
}

export async function removeSubscriber(email: string): Promise<void> {
  const list = await load();
  const existing = list.find((s) => s.email === email.trim().toLowerCase());
  if (existing) {
    existing.subscribed = false;
    await save(list);
  }
}
