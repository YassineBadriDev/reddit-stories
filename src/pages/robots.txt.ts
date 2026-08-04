import type { APIRoute } from "astro";
import { config } from "@/lib/config";

export const prerender = false;

const rules = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*?sort=
Disallow: /*?sub=
Disallow: /search?*

Sitemap: ${config.siteUrl}/sitemap.xml`;

export const GET: APIRoute = () =>
  new Response(rules, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
