const nodeEnv = typeof process !== "undefined" ? process.env : {};
const astroEnv = (import.meta.env ?? {}) as Record<string, string | undefined>;

function env(key: string): string | undefined {
  return astroEnv[key] ?? nodeEnv[key];
}

export const config = {
  siteUrl: (env("SITE_URL") ?? "http://localhost:4321").replace(/\/$/, ""),
  siteName: env("SITE_NAME") ?? "Reddit Stories",
  siteTagline: env("SITE_TAGLINE") ?? "Reddit stories, in one place",
  contactEmail: env("CONTACT_EMAIL") ?? "hello@redditstories.org",

  redditUserAgent:
    env("REDDIT_USER_AGENT") ?? "redditstories.org/0.1 by redditstories.org",
  subreddits: (env("SUBREDDITS") ?? "stories,RedditStoryTime,nosleep")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  defaultSort: (env("DEFAULT_SORT") ?? "top") as "top" | "hot" | "new",
  defaultLimit: Number(env("DEFAULT_LIMIT") ?? "25"),
  cacheTtlSeconds: Number(env("CACHE_TTL_SECONDS") ?? "600"),
  scraperMode: (env("SCRAPER_MODE") ?? "auto") as "auto" | "http" | "browser",
  scraperSource: (env("SCRAPER_SOURCE") ?? "auto") as "auto" | "reddit" | "mirror",
  mirrorProvider: (env("MIRROR_PROVIDER") ?? "arctic-shift") as
    | "arctic-shift"
    | "pullpush",

  resendApiKey: env("RESEND_API_KEY") ?? "",
  newsletterFrom: env("NEWSLETTER_FROM") ?? "Reddit Stories <stories@redditstories.org>",
  newsletterTo: env("NEWSLETTER_TO") ?? "hello@redditstories.org",
  resendAudienceId: env("RESEND_AUDIENCE_ID") ?? "",
  cronSecret: env("CRON_SECRET") ?? "",
};
