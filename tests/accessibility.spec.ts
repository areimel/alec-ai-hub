import AxeBuilder from "@axe-core/playwright";
import { expect, open, setTheme, test } from "./helpers";

const routes = [
  "/",
  "/prompts",
  "/custom-agents",
  "/skills-plugins",
  "/prompts/code-review-template",
  "/prompts/ai-prompt-template",
  "/prompts/web-developer",
  "/custom-agents/code-reviewer",
  "/skills-plugins/commit-message-writer",
  "/skills-plugins/git-writing-kit",
  "/diy-prompt-library",
  "/submit-prompt",
  "/privacy",
  "/terms",
  "/ccpa",
  "/__missing_route__",
];

for (const theme of ["dark", "light"] as const) {
  for (const route of routes) {
    test(`${theme} ${route}: h1, axe, errors, overflow, ids`, async ({ page, errors }) => {
      await setTheme(page, theme);
      const response = await open(page, route);
      expect(response?.status()).toBe(route === "/__missing_route__" ? 404 : 200);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
      await expect(page.locator("h1")).toHaveCount(1);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`),
      ).toEqual([]);

      const ids = await page.evaluate(() => {
        const seen = new Map<string, number>();
        document.querySelectorAll("[id]").forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
        return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
      });
      expect(ids, "duplicate ids").toEqual([]);

      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, `horizontal scroll at ${width}px`).toBeLessThanOrEqual(width);
      }
      // The 404 document itself is logged by Chromium as a failed resource; that is expected.
      const unexpected = errors.filter(
        (e) => !(route === "/__missing_route__" && /status of 404/.test(e)),
      );
      expect(unexpected).toEqual([]);
    });
  }
}
