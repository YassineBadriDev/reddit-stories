import { env } from "cloudflare:workers";

export default env as unknown as Record<string, string | undefined>;
