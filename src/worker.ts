import { handle as cfHandle } from "@astrojs/cloudflare/handler";
import { refreshAllSnapshots } from "@/lib/snapshot";

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
      refreshAllSnapshots().catch((error) => {
        console.error("snapshot refresh failed", error);
      })
    );
  },
};
