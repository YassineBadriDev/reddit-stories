export interface StorageBackend {
  read(name: string): Promise<string | undefined>;
  write(name: string, content: string): Promise<void>;
  remove(name: string): Promise<void>;
}

// In-memory backend used on Cloudflare Workers, where there is no filesystem.
// Data lives for the lifetime of the worker isolate; use a KV binding or an
// external store (e.g. Resend audience) for durable persistence.
const store = new Map<string, string>();

const backend: StorageBackend = {
  async read(name) {
    return store.get(name);
  },
  async write(name, content) {
    store.set(name, content);
  },
  async remove(name) {
    store.delete(name);
  },
};

export default backend;
