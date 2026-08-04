import type { Browser, Page } from "playwright";
import { ScraperError } from "./types";

let browserPromise: Promise<Browser> | null = null;

const stealthInit = `
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
window.chrome = window.chrome || { runtime: {} };
`;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("playwright");
      return chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
      });
    })();
  }
  return browserPromise;
}

export async function browserGetJson<T>(url: string): Promise<T> {
  let browser: Browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    throw new ScraperError(
      "blocked",
      `Browser fallback unavailable. Install chromium with "npx playwright install chromium". (${String(error)})`
    );
  }

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  await context.addInitScript(stealthInit);

  let page: Page | null = null;
  try {
    page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (response && response.status() === 403) {
      throw new ScraperError("blocked", "Blocked (HTTP 403)");
    }
    if (response && response.status() === 404) {
      throw new ScraperError("not_found", "Not found (HTTP 404)");
    }
    const text = await page.evaluate(() => document.body.innerText);
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    if (error instanceof Error && error.message.includes("net::ERR")) {
      throw new ScraperError("network", `Browser navigation failed: ${error.message}`);
    }
    throw new ScraperError("parse", `Browser parse failed: ${String(error)}`);
  } finally {
    if (page) await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}
