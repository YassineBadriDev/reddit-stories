import type { APIRoute } from "astro";
import { refreshDailySnapshot } from "@/lib/snapshot";
import { config } from "@/lib/config";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const POST: APIRoute = async ({ request, url }) => {
  if (!config.cronSecret) {
    return json({ error: "CRON_SECRET is not configured." }, 503);
  }

  const secret =
    url.searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  if (secret !== config.cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const count = await refreshDailySnapshot();
    return json({ ok: true, stories: count });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Refresh failed" },
      502
    );
  }
};

export const GET: APIRoute = POST;
