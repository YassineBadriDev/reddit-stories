import { ScraperError } from "./types";

// Stub used in the Cloudflare worker bundle so Node-only dependencies
// (got-scraping, Playwright) are never included. The mirror tier handles all
// fetching on Cloudflare; this should never be called.
export async function fetchJsonEscalated<T>(_url: string): Promise<T> {
  throw new ScraperError(
    "blocked",
    "Native scraper tier is not available on this platform"
  );
}
