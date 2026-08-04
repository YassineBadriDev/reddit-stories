import { defineMiddleware } from "astro:middleware";
import { applyRuntimeEnv } from "@/lib/config";

// On Cloudflare, runtime env vars/bindings arrive through
// `context.locals.runtime.env`; make them available to the rest of the app.
// On Node/Vercel this is a no-op (process.env is already populated).
export const onRequest = defineMiddleware(async (context, next) => {
  const runtime = (
    context.locals as {
      runtime?: { env?: Record<string, string | undefined> };
    }
  ).runtime;
  if (runtime?.env) applyRuntimeEnv(runtime.env);
  return next();
});
