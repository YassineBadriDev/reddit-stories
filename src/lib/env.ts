export function isCloudflare(): boolean {
  return typeof globalThis !== "undefined" && "caches" in globalThis;
}

export function isVercel(): boolean {
  return typeof process !== "undefined" && process.env.VERCEL === "1";
}
