import { spawn } from "node:child_process";

// Cross-platform build wrapper: `node scripts/build.mjs <hosting>`
// where <hosting> is node | cloudflare | vercel (defaults to $HOSTING or "node").
const hosting = (process.argv[2] ?? process.env.HOSTING ?? "node").toLowerCase();
const supported = ["node", "cloudflare", "vercel"];

if (!supported.includes(hosting)) {
  console.error(`Unknown HOSTING "${hosting}". Expected one of: ${supported.join(", ")}`);
  process.exit(1);
}

process.env.HOSTING = hosting;
console.log(`[build] HOSTING=${hosting}`);

const child = spawn("npx", ["astro", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
