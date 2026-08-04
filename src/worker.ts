import { handle as cfHandle } from "@astrojs/cloudflare/handler";
import { refreshDailySnapshot } from "@/lib/snapshot";

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}

const handle = cfHandle as unknown as (
  request: Request,
  env: unknown,
  ctx: Ctx
) => Promise<Response>;

export default {
  async fetch(request: Request, env: unknown, ctx: Ctx) {
    return handle(request, env, ctx);
  },
  async scheduled(_controller: unknown, _env: unknown, ctx: Ctx) {
    ctx.waitUntil(
      refreshDailySnapshot().catch((error) => {
        console.error("daily snapshot refresh failed", error);
      })
    );
  },
};
