import type { APIRoute } from "astro";
import { config } from "@/lib/config";

export const prerender = false;

const content = `# Reddit Stories

> RedditStories.org — the best reddit stories, in one place.

Reddit Stories is a reading site that aggregates story posts from public
Reddit communities. We do not host the stories: every story belongs to its
original author on Reddit, and each story page credits the author.
RedditStories.org is not affiliated with, endorsed by, or connected to
Reddit Inc.

## H1

Reddit Stories

## Key pages

- [Home — latest reddit stories](${config.siteUrl}/)
- [Search reddit stories](${config.siteUrl}/search)
- [About the sources](${config.siteUrl}/disclaimer)
- [Privacy Policy](${config.siteUrl}/privacy)
- [Terms of Service](${config.siteUrl}/terms)
- [Contact](${config.siteUrl}/contact)

## Optional

For daily story updates, see the [newsletter](${config.siteUrl}/#newsletter).
Structured data: every story page embeds schema.org Article metadata crediting
the original author, and the home page embeds an ItemList of the latest
stories.`;

export const GET: APIRoute = () =>
  new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
