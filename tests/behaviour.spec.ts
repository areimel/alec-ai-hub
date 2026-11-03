import { blockThirdParty, expect, open, test } from "./helpers";

const cards = (page: import("@playwright/test").Page) => page.locator(".prompt-card:visible");

test.describe("directory filters", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/prompts");
  });

  test("search narrows cards, updates the count, shows the empty state and resets", async ({ page }) => {
    const total = await page.locator(".prompt-card").count();
    await expect(page.locator("#resultCount")).toHaveText(`Showing ${total} of ${total} prompts`);
    await page.locator("#searchInput").fill("react");
    const shown = await cards(page).count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    await expect(page.locator("#resultCount")).toHaveText(`Showing ${shown} of ${total} prompts`);

    await page.locator("#searchInput").fill("zzzz-no-such-prompt");
    await expect(cards(page)).toHaveCount(0);
    await expect(page.locator("#emptyState")).toBeVisible();
    await expect(page.locator("#resultCount")).toHaveText(`Showing 0 of ${total} prompts`);

    await page.locator("#resetFilters").click();
    await expect(cards(page)).toHaveCount(total);
    await expect(page.locator("#emptyState")).toBeHidden();
    await expect(page.locator("#searchInput")).toHaveValue("");
  });

  test("category, tool and tag filters work, combine and reset", async ({ page }) => {
    const total = await page.locator(".prompt-card").count();
    const visibleCount = (attr: string, value: string) =>
      page.locator(`.prompt-card[${attr}="${value}"]`).count();

    // Category.
    const category = page.locator(".category-filter:not([data-category=all])").first();
    const categoryName = (await category.getAttribute("data-category"))!;
    await category.click();
    await expect(category).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.category-filter[data-category="all"]')).toHaveAttribute("aria-pressed", "false");
    await expect(cards(page)).toHaveCount(await visibleCount("data-category", categoryName));
    expect(await cards(page).count()).toBeLessThan(total);

    // Tool (subcategory), combined with the category.
    const tools = await page.locator(".prompt-card[data-category]").evaluateAll(
      (els, cat) => els.filter((e) => (e as HTMLElement).dataset.category === cat).map((e) => (e as HTMLElement).dataset.subcategory!),
      categoryName,
    );
    const toolName = tools[0];
    const tool = page.locator(`.subcategory-filter[data-subcategory="${toolName}"]`);
    await tool.click();
    await expect(tool).toHaveAttribute("aria-pressed", "true");
    const both = await page
      .locator(`.prompt-card[data-category="${categoryName}"][data-subcategory="${toolName}"]`)
      .count();
    await expect(cards(page)).toHaveCount(both);

    // Tag, combined with category + tool.
    const tagName = await page.locator(".prompt-card:visible").first().evaluate((el) => JSON.parse((el as HTMLElement).dataset.tags!)[0] as string);
    const tag = page.locator(`.tag-filter[data-tag="${tagName}"]`);
    await tag.click();
    await expect(tag).toHaveAttribute("aria-pressed", "true");
    const expected = await page.locator(".prompt-card").evaluateAll(
      (els, [c, t, g]) =>
        els.filter((e) => {
          const d = (e as HTMLElement).dataset;
          return d.category === c && d.subcategory === t && JSON.parse(d.tags!).includes(g);
        }).length,
      [categoryName, toolName, tagName],
    );
    await expect(cards(page)).toHaveCount(expected);
    await tag.click();
    await expect(tag).toHaveAttribute("aria-pressed", "false");

    // Search combined with the active filters.
    await page.locator("#searchInput").fill("zzzz-no-such-prompt");
    await expect(page.locator("#emptyState")).toBeVisible();

    // Reset restores everything.
    await page.locator("#resetFilters").click();
    await expect(cards(page)).toHaveCount(total);
    await expect(page.locator('.category-filter[data-category="all"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.subcategory-filter[data-subcategory="all"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.tag-filter[aria-pressed="true"]')).toHaveCount(0);
  });

  test("mobile filter toggle opens, closes and stays open while typing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.locator("#mobileMenuToggle");
    const panel = page.locator("#sidebarContent");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await page.locator("#searchInput").click();
    await page.locator("#searchInput").pressSequentially("react");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });
});

test.describe("copy", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });
  const clip = (page: import("@playwright/test").Page) => page.evaluate(() => navigator.clipboard.readText());

  test("card copy puts the exact prompt on the clipboard and resets", async ({ page }) => {
    await open(page, "/prompts");
    const card = page.locator(".prompt-card").nth(1);
    const expected = await card.locator("pre").evaluate((el) => el.textContent ?? "");
    const button = card.locator(".copy-button");
    await button.click();
    await expect(button).toHaveAttribute("data-copied", "true");
    await expect(button).toHaveText("Copied");
    expect(await clip(page)).toBe(expected);
    await expect(button).not.toHaveAttribute("data-copied", "true", { timeout: 5000 });
    await expect(button).toHaveText("Copy prompt");
  });

  test("detail page copies the prompt and the link", async ({ page }) => {
    await open(page, "/prompts/web-developer");
    const expected = await page.locator("#promptContent").evaluate((el) => el.textContent ?? "");
    const copy = page.locator("#copyPrompt");
    await copy.click();
    await expect(copy).toHaveAttribute("data-copied", "true");
    expect(await clip(page)).toBe(expected);
    await expect(copy).not.toHaveAttribute("data-copied", "true", { timeout: 5000 });

    const link = page.locator("#copyLink");
    await link.click();
    await expect(link).toHaveAttribute("data-copied", "true");
    expect(await clip(page)).toBe(page.url());
  });
});

test.describe("templates", () => {
  test("typing updates the prompt, values with $ work, reset restores, fields are labelled", async ({ page }) => {
    await open(page, "/prompts/code-review-template");
    const prompt = page.locator("#promptContent");
    const original = (await prompt.textContent()) ?? "";
    expect(original).toContain("@language");
    const input = page.locator("#var-language");
    await input.fill("Rust $& $1 $$");
    await expect(prompt).toContainText("I'm working with Rust $& $1 $$ and");
    await expect(prompt).not.toContainText("@language");
    await page.locator("#resetTemplateBtn").click();
    await expect(prompt).toHaveText(original);
    await expect(input).toHaveValue("");
  });

  for (const slug of ["code-review-template", "ai-prompt-template"]) {
    test(`${slug}: every generated input has a label`, async ({ page }) => {
      await open(page, `/prompts/${slug}`);
      await expect(page.locator("#templateForm input").first()).toBeVisible();
      const unlabelled = await page.locator("#templateForm input").evaluateAll((els) =>
        els.filter((e) => (e as HTMLInputElement).labels?.length === 0 || !(e as HTMLInputElement).labels).map((e) => e.id),
      );
      expect(unlabelled).toEqual([]);
      const first = page.locator("#templateForm input").first();
      const before = await page.locator("#promptContent").textContent();
      await first.fill("Value-123");
      await expect(page.locator("#promptContent")).not.toHaveText(before!);
      await expect(page.locator("#promptContent")).toContainText("Value-123");
    });
  }

  test("a non-template prompt has no template menu", async ({ page }) => {
    await open(page, "/prompts/web-developer");
    await expect(page.locator("#templateMenu")).toHaveCount(0);
  });
});

test.describe("theme, navigation, FAQ", () => {
  test("dark by default even when the OS prefers light; toggle persists", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ colorScheme: "light", baseURL });
    const page = await context.newPage();
    await open(page, "/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
    await context.close();
  });

  test("mobile nav closes on Escape and returns focus to its trigger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, "/");
    const menu = page.locator("button[aria-controls=mobile-navigation]");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#mobile-navigation")).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test("skip link moves focus to main", async ({ page }) => {
    await open(page, "/prompts");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("FAQ opens with the keyboard", async ({ page }) => {
    await open(page, "/");
    const list = page.locator(".faq-list");
    await list.scrollIntoViewIfNeeded();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    const trigger = list.getByRole("button").first();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("real data", () => {
  test("homepage prompt count equals the cards in the directory", async ({ page }) => {
    await open(page, "/");
    const homeCount = Number(
      await page.locator(".stat-strip div", { hasText: "Prompts" }).first().locator("dd").textContent(),
    );
    await open(page, "/prompts");
    const cardCount = await page.locator(".prompt-card").count();
    expect(cardCount).toBe(18);
    expect(homeCount).toBe(cardCount);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("home, directory and a post show content and nav links", async ({ page, request }) => {
    await blockThirdParty(page);
    const html = await (await request.get("/")).text();
    for (const href of ["/prompts", "/ai-personas", "/blog"]) {
      expect(html, `server HTML nav link ${href}`).toMatch(new RegExp(`<nav[\\s\\S]*href="${href}"`));
    }

    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("header nav a[href='/prompts']").first()).toBeVisible();

    await page.goto("/prompts");
    await expect(page.locator(".prompt-card")).toHaveCount(18);
    await expect(page.locator(".prompt-card").first().locator("pre")).toBeAttached();
    await expect(page.locator("#searchInput")).toBeVisible(); // desktop width

    await page.goto("/blog/template-prompts-feature");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".post-body")).toContainText(/\w{10}/);
  });

  test("mobile directory filters reachability without JS (informational)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/prompts");
    await expect(page.locator(".prompt-card")).toHaveCount(18);
    const reachable = await page.locator("#searchInput").isVisible();
    test.info().annotations.push({ type: "no-js mobile filters visible", description: String(reachable) });
    console.log(`NO-JS 390px filters visible: ${reachable}`);
  });
});
