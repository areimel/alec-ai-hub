// Captures the two DIY landing preview shots from a running preview server.
// Usage: node scripts/capture-diy-previews.mjs [baseUrl]   (default http://localhost:4391)
import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.argv[2] || "http://localhost:4391").replace(/\/$/, "");
const outDir = path.join(root, "src/assets/diy");
const contentDir = path.join(root, "src/content/prompts");

const shots = [
  { name: "directory", route: "/prompts" },
  { name: "detail", route: `/prompts/${firstPromptSlug()}` },
];

function firstPromptSlug() {
  const file = fs
    .readdirSync(contentDir)
    .filter((f) => /\.(mdx?|md)$/.test(f))
    .sort()[0];
  if (!file) throw new Error(`No prompt files found in ${contentDir}`);
  return file.replace(/\.(mdx?|md)$/, "");
}

// Hide cookie and announcement overlays so they never sit over the captured UI.
const hideOverlays = `
  .announcement, [class*="cookie" i], [id*="cookie" i],
  [class*="announcement" i][role="region"] { display: none !important; }
`;

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  // The site reads the saved theme from localStorage; default is dark anyway.
  await context.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
    } catch {
      /* storage blocked: the page falls back to dark */
    }
  });

  const page = await context.newPage();
  for (const shot of shots) {
    const url = `${baseUrl}${shot.route}`;
    console.log(`Capturing ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: hideOverlays });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));

    const png = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: png, fullPage: false });

    const webp = path.join(outDir, `${shot.name}.webp`);
    await sharp(png).webp({ quality: 80 }).toFile(webp);
    fs.unlinkSync(png);

    const meta = await sharp(webp).metadata();
    const kb = (fs.statSync(webp).size / 1024).toFixed(1);
    console.log(`Wrote ${webp} (${meta.width}x${meta.height}, ${kb} KB)`);
  }
  await context.close();
} finally {
  await browser.close();
}
