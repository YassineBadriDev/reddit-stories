import { join } from "node:path";

export function dataDir(): string {
  const env = typeof process !== "undefined" ? process.env.DATA_DIR : undefined;
  return env ?? join(process.cwd(), "data");
}

export function dataFile(name: string): string {
  return join(dataDir(), name);
}
