import type { APIRoute } from "astro";
import { fetchStories } from "@/lib/scraper";
import { config } from "@/lib/config";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const GET: APIRoute = async ({ url }) => {
  const sub = url.searchParams.get("sub");
  const sortParam = url.searchParams.get("sort");
  const limitParam = url.searchParams.get("limit");

  const sort =
    sortParam === "top" || sortParam === "hot" || sortParam === "new"
      ? sortParam
      : config.defaultSort;
  const limit = Math.min(Math.max(Number(limitParam) || config.defaultLimit, 1), 100);
  const subreddits = sub
    ? sub.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  try {
    const stories = await fetchStories({ subreddits, sort, limit });
    return json({ stories, count: stories.length });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load stories" },
      502
    );
  }
};
