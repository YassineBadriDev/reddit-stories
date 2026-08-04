import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pick the hosting platform at build time:
//   HOSTING=cloudflare  -> Cloudflare Pages (dist/_worker.js)
//   HOSTING=vercel      -> Vercel (dist/server or functions)
//   HOSTING=node        -> Node server (dist/server/entry.mjs) — default
const hosting = (process.env.HOSTING ?? "node").trim().toLowerCase();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (p) => path.resolve(__dirname, p);

// Native (Node-only) modules must be excluded from the Cloudflare worker
// bundle. We swap them for stubs via resolve.alias at build time.
const nativeAliases =
  hosting === "cloudflare"
    ? {
        "@storage-backend": resolve("src/lib/storage/memory.ts"),
        "@scraper-native": resolve("src/lib/scraper/native-stub.ts"),
      }
    : {
        "@storage-backend": resolve("src/lib/storage/disk.ts"),
        "@scraper-native": resolve("src/lib/scraper/native.ts"),
      };

async function adapter() {
  if (hosting === "cloudflare") {
    const { default: cloudflare } = await import("@astrojs/cloudflare");
    return cloudflare();
  }
  if (hosting === "vercel") {
    const { default: vercel } = await import("@astrojs/vercel");
    return vercel();
  }
  const { default: node } = await import("@astrojs/node");
  return node({ mode: "standalone" });
}

export default defineConfig({
  site: process.env.SITE_URL ?? "https://redditstories.org",
  output: "server",
  adapter: await adapter(),
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    service:
      hosting === "cloudflare"
        ? { entrypoint: "astro/assets/services/cloudflare" }
        : { entrypoint: "astro/assets/services/sharp" },
  },
  vite: {
    resolve: {
      alias: nativeAliases,
    },
    build: {
      target: hosting === "cloudflare" ? "es2022" : "es2022",
    },
  },
});
