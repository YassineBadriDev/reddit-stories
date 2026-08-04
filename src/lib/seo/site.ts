import { config } from "@/lib/config";

export const site = {
  name: config.siteName,
  alternateName: "Reddit Stories",
  url: config.siteUrl,
  tagline: config.siteTagline,
  description:
    "Reddit stories, in one place. Read the best reddit stories from the biggest story subreddits — updated daily, free to read.",
  keywords: "reddit stories, best reddit stories, read reddit stories, reddit stories online",
  language: "en",
  publisher: "RedditStories.org",
  logo: `${config.siteUrl}/logo.svg`,
  favicon: `${config.siteUrl}/favicon.svg`,
  ogImage: `${config.siteUrl}/og.png`,
  sameAs: [] as string[],
};

export const keyword = {
  primary: "reddit stories",
};
