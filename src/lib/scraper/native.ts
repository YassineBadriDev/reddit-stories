import { config } from "@/lib/config";
import { httpGetJson } from "./http";
import { browserGetJson } from "./browser";
import { ScraperError } from "./types";

// Direct Reddit scraping tier (got-scraping HTTP + Playwright browser).
// Bundled only for Node/Vercel builds; swapped for a stub on Cloudflare.
export async function fetchJsonEscalated<T>(url: string): Promise<T> {
  const mode = config.scraperMode;
  if (mode === "browser") {
    return browserGetJson<T>(url);
  }
  try {
    return (await httpGetJson<T>(url)).body;
  } catch (error) {
    if (mode === "http") throw error;
    if (
      error instanceof ScraperError &&
      (error.code === "rate_limited" ||
        error.code === "blocked" ||
        error.code === "network")
    ) {
      return browserGetJson<T>(url);
    }
    throw error;
  }
}
