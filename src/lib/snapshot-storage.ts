import { env } from "cloudflare:workers";

interface KVLike {
  get(name: string): Promise<string | null>;
  put(name: string, value: string): Promise<void>;
  delete(name: string): Promise<void>;
}

const ns = (env as unknown as { STORY_CACHE?: KVLike }).STORY_CACHE;

const backend = {
  async read(name: string): Promise<string | undefined> {
    if (!ns) return undefined;
    return (await ns.get(name)) ?? undefined;
  },
  async write(name: string, content: string): Promise<void> {
    await ns?.put(name, content);
  },
  async remove(name: string): Promise<void> {
    await ns?.delete(name);
  },
};

export default backend;
