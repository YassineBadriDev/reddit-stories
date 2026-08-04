import { gotScraping, type OptionsInit } from "got-scraping";
import { config } from "@/lib/config";
import { ScraperError } from "./types";

export interface HttpResult<T> {
  body: T;
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
}

const baseOptions: OptionsInit = {
  responseType: "json",
  resolveBodyOnly: false,
  timeout: { request: 20000 },
  retry: {
    limit: 3,
    methods: ["GET"],
    statusCodes: [403, 408, 413, 429, 500, 502, 503, 504],
    maxRetryAfter: 5000,
  },
  headers: {
    "user-agent": config.redditUserAgent,
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
  },
};

function toStatusError(statusCode: number): ScraperError {
  if (statusCode === 429) {
    return new ScraperError("rate_limited", `Rate limited (HTTP ${statusCode})`);
  }
  if (statusCode === 403 || statusCode === 451) {
    return new ScraperError("blocked", `Blocked (HTTP ${statusCode})`);
  }
  if (statusCode === 404) {
    return new ScraperError("not_found", `Not found (HTTP ${statusCode})`);
  }
  return new ScraperError("network", `Unexpected status ${statusCode}`);
}

export async function httpGetJson<T>(
  url: string,
  options: OptionsInit = {}
): Promise<HttpResult<T>> {
  try {
    const merged = {
      ...baseOptions,
      ...options,
      responseType: "json" as const,
      resolveBodyOnly: false as const,
      isStream: false as const,
    };
    const response = await gotScraping<T>(url, merged);
    if (response.statusCode >= 400) {
      throw toStatusError(response.statusCode);
    }
    return {
      body: response.body as T,
      statusCode: response.statusCode,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    const statusCode = (error as { response?: { statusCode?: number } })
      .response?.statusCode;
    if (statusCode) {
      throw toStatusError(statusCode);
    }
    const code = (error as { code?: string }).code;
    if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ENOTFOUND") {
      throw new ScraperError("network", `Request failed (${code})`);
    }
    throw new ScraperError("network", `Request failed: ${String(error)}`);
  }
}
