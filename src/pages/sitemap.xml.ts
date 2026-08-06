import type { APIRoute } from "astro";
import { config } from "@/lib/config";
import { fetchStories } from "@/lib/scraper";
import { categories } from "@/lib/categories";

export const prerender = false;

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const GET: APIRoute = async () => {
  const siteUrl = config.siteUrl;
  const feedPaths = ["/latest-reddit-stories", "/top-reddit-stories", "/trending-reddit-stories"];
  const staticPaths = ["/", "/categories", "/search", "/privacy", "/terms", "/contact", "/disclaimer"];

  let storyUrls = "";
  try {
    const stories = await fetchStories();
    storyUrls = stories
      .map((story) => {
        const lastmod = new Date(story.createdAt).toISOString().slice(0, 10);
        return `  <url><loc>${xmlEscape(story.url)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`;
      })
      .join("\n");
  } catch {
    storyUrls = "";
  }

  const staticUrls = staticPaths
    .map(
      (path) =>
        `  <url><loc>${siteUrl}${path}</loc><changefreq>daily</changefreq><priority>${path === "/" ? "1.0" : "0.5"}</priority></url>`
    )
    .join("\n");

  const feedUrls = feedPaths
    .map(
      (path) =>
        `  <url><loc>${siteUrl}${path}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`
    )
    .join("\n");

  const categoryUrls = categories
    .map(
      (category) =>
        `  <url><loc>${siteUrl}/${category.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${feedUrls}
${categoryUrls}
${storyUrls}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
