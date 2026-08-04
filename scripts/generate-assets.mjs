import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const sizes = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

const faviconSvg = await readFile(join(publicDir, "favicon.svg"));

for (const { name, size } of sizes) {
  await sharp(faviconSvg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log(`wrote ${name}`);
}

await sharp(join(publicDir, "og.svg"), { density: 300 })
  .resize(1200, 630)
  .png()
  .toFile(join(publicDir, "og.png"));
console.log("wrote og.png");
