// Regenerates public/opengraph.jpg from src/assets/opengraph-source.svg.
// Usage: node scripts/render-og.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../src/assets/opengraph-source.svg", import.meta.url));
await sharp(svg, { density: 96 })
  .resize(1200, 630)
  .jpeg({ quality: 88 })
  .toFile(new URL("../public/opengraph.jpg", import.meta.url).pathname);
