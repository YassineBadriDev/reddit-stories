import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface StorageBackend {
  read(name: string): Promise<string | undefined>;
  write(name: string, content: string): Promise<void>;
  remove(name: string): Promise<void>;
}

function dataDir(): string {
  const env = typeof process !== "undefined" ? process.env.DATA_DIR : undefined;
  const base =
    env ??
    (typeof process !== "undefined" && process.env.VERCEL === "1"
      ? "/tmp"
      : typeof process !== "undefined"
        ? process.cwd()
        : ".");
  return join(base, "data");
}

function dataFile(name: string): string {
  return join(dataDir(), name);
}

const backend: StorageBackend = {
  async read(name) {
    try {
      return await readFile(dataFile(name), "utf8");
    } catch {
      return undefined;
    }
  },
  async write(name, content) {
    await mkdir(dataDir(), { recursive: true });
    await writeFile(dataFile(name), content, "utf8");
  },
  async remove(name) {
    try {
      await rm(dataFile(name));
    } catch {
      // ignore
    }
  },
};

export default backend;
