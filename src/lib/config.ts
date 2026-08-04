import { isCloudflare } from "@/lib/env";

const nodeEnv = typeof process !== "undefined" ? process.env : {};
const astroEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;

// Runtime env overrides (e.g. Cloudflare worker bindings injected per request
// via middleware). These take precedence over import.meta.env and process.env.
const runtime = new Map<string, string>();

export function applyRuntimeEnv(
  record: Record<string, string | undefined>
): void {
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) runtime.set(key, value);
  }
}

function env(key: string): string | undefined {
  return runtime.get(key) ?? astroEnv[key] ?? nodeEnv[key];
}

export const config = {
  get siteUrl(): string {
    return (env("SITE_URL") ?? "http://localhost:4321").replace(/\/$/, "");
  },
  get siteName(): string {
    return env("SITE_NAME") ?? "Reddit Stories";
  },
  get siteTagline(): string {
    return env("SITE_TAGLINE") ?? "Reddit stories, in one place";
  },
  get contactEmail(): string {
    return env("CONTACT_EMAIL") ?? "hello@redditstories.org";
  },
  get redditUserAgent(): string {
    return env("REDDIT_USER_AGENT") ?? "redditstories.org/0.1 by redditstories.org";
  },
  get subreddits(): string[] {
    return (env("SUBREDDITS") ?? "stories,RedditStoryTime,nosleep")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get defaultSort(): "top" | "hot" | "new" {
    return (env("DEFAULT_SORT") ?? "top") as "top" | "hot" | "new";
  },
  get defaultLimit(): number {
    return Number(env("DEFAULT_LIMIT") ?? "25");
  },
  get cacheTtlSeconds(): number {
    return Number(env("CACHE_TTL_SECONDS") ?? "600");
  },
  get scraperMode(): "auto" | "http" | "browser" {
    return (env("SCRAPER_MODE") ?? (isCloudflare() ? "http" : "auto")) as
      | "auto"
      | "http"
      | "browser";
  },
  get scraperSource(): "auto" | "reddit" | "mirror" {
    return (env("SCRAPER_SOURCE") ?? (isCloudflare() ? "mirror" : "auto")) as
      | "auto"
      | "reddit"
      | "mirror";
  },
  get mirrorProvider(): "arctic-shift" | "pullpush" {
    return (env("MIRROR_PROVIDER") ?? "arctic-shift") as
      | "arctic-shift"
      | "pullpush";
  },
  get resendApiKey(): string {
    return env("RESEND_API_KEY") ?? "";
  },
  get newsletterFrom(): string {
    return env("NEWSLETTER_FROM") ?? "Reddit Stories <stories@redditstories.org>";
  },
  get newsletterTo(): string {
    return env("NEWSLETTER_TO") ?? "hello@redditstories.org";
  },
  get resendAudienceId(): string {
    return env("RESEND_AUDIENCE_ID") ?? "";
  },
  get cronSecret(): string {
    return env("CRON_SECRET") ?? "";
  },
};
