import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://redditstories.org",
  output: "server",
  adapter: node({ mode: "standalone" }),
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
  vite: {
    build: {
      target: "es2022",
    },
  },
});
