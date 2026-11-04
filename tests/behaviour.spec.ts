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

  test("home, directory and an agent page show content and nav links", async ({ page, request }) => {
    await blockThirdParty(page);
    const html = await (await request.get("/")).text();
    for (const href of ["/prompts", "/custom-agents", "/skills-plugins"]) {
      expect(html, `server HTML nav link ${href}`).toMatch(new RegExp(`<nav[\\s\\S]*href="${href}"`));
    }

    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("header nav a[href='/prompts']").first()).toBeVisible();

    await page.goto("/prompts");
    await expect(page.locator(".prompt-card")).toHaveCount(18);
    await expect(page.locator(".prompt-card").first().locator("pre")).toBeAttached();
    await expect(page.locator("#searchInput")).toBeVisible(); // desktop width

    await page.goto("/custom-agents/code-reviewer");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#promptContent")).toContainText(/\w{10}/);
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

test.describe("legal pages", () => {
  for (const path of ["/privacy", "/ccpa"]) {
    test(`${path} links privacy requests to the contact form`, async ({ page }) => {
      await open(page, path);
      await page.locator('.prose a[href="/#contact"]').first().click();
      await expect(page).toHaveURL(/\/#contact$/);
      await expect(page.locator("#contact #form")).toBeInViewport();
    });
  }
});

const PORTFOLIO = "https://alecreimel.com/";
const REPO = "https://github.com/areimel/alec-ai-hub";

test.describe("header and footer links", () => {
  test("desktop header has Portfolio and GitHub repo links that open in a new tab", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await open(page, "/");
    for (const [name, href] of [["Portfolio", PORTFOLIO], ["GitHub repo", REPO]]) {
      const link = page.locator("header > div").getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  });

  for (const width of [390, 768]) {
    test(`at ${width}px the CTAs are hidden in the bar and appear in the mobile menu`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await open(page, "/");
      for (const href of [PORTFOLIO, REPO]) {
        await expect(page.locator(`header > div a[href="${href}"]`)).toBeHidden();
        await expect(page.locator(`#mobile-navigation a[href="${href}"]`)).toBeHidden();
      }
      await page.locator("button[aria-controls=mobile-navigation]").click();
      await expect(page.locator("#mobile-navigation")).toBeVisible();
      for (const href of [PORTFOLIO, REPO]) {
        const link = page.locator(`#mobile-navigation a[href="${href}"]`);
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /noopener/);
        await expect(page.locator(`header > div a[href="${href}"]`)).toBeHidden();
      }
    });
  }

  test("footer links to the DIY library and the repo; the header does not link to the DIY library", async ({ page }) => {
    await open(page, "/");
    await expect(page.locator('footer a[href="/diy-prompt-library"]')).toHaveCount(1);
    await expect(page.locator('header a[href="/diy-prompt-library"]')).toHaveCount(0);
    const repo = page.locator(`footer a[href="${REPO}"]`);
    await expect(repo).toHaveCount(1);
    await expect(repo).toHaveAttribute("target", "_blank");
    await expect(repo).toHaveAttribute("rel", /noopener/);
  });

  test("header nav has exactly Prompts, Custom Agents and Skills & Plugins", async ({ page }) => {
    await open(page, "/");
    const expected = ["Prompts", "Custom Agents", "Skills & Plugins"];
    expect(await page.locator('header nav[aria-label="Primary"] a').allTextContents()).toEqual(expected);
    expect(
      (await page.locator("#mobile-navigation li a").allTextContents()).map((t) => t.trim()),
    ).toEqual(expected);
  });
});

test.describe("old URL redirects", () => {
  for (const [from, to] of [
    ["/ai-personas", "/custom-agents"],
    ["/ai-personas/technical-mentor", "/custom-agents"],
    ["/blog", "/"],
    ["/blog/template-prompts-feature", "/"],
  ]) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await blockThirdParty(page);
      await page.goto(from);
      await expect.poll(() => new URL(page.url()).pathname).toBe(to);
    });
  }
});

test.describe("agents and skills", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });
  const clip = (page: import("@playwright/test").Page) => page.evaluate(() => navigator.clipboard.readText());

  for (const path of ["/custom-agents/code-reviewer", "/skills-plugins/commit-message-writer"]) {
    test(`${path} detail page copies a file starting with front matter`, async ({ page }) => {
      await open(page, path);
      const copy = page.locator("#copyPrompt");
      await copy.click();
      await expect(copy).toHaveAttribute("data-copied", "true");
      const text = await clip(page);
      expect(text.startsWith("---\nname: ")).toBe(true);
      expect(text).toBe(await page.locator("#promptContent").evaluate((el) => el.textContent ?? ""));
    });
  }

  test("a card copy button on /custom-agents copies a file starting with front matter", async ({ page }) => {
    await open(page, "/custom-agents");
    const card = page.locator(".prompt-card").first();
    const expected = await card.locator("pre").evaluate((el) => el.textContent ?? "");
    const button = card.locator(".copy-button");
    await button.click();
    await expect(button).toHaveAttribute("data-copied", "true");
    const text = await clip(page);
    expect(text.startsWith("---\nname: ")).toBe(true);
    expect(text).toBe(expected);
  });

  test("directories show 5 agents and 4 skills; the Plugin filter shows 1", async ({ page }) => {
    await open(page, "/custom-agents");
    await expect(page.locator(".prompt-card")).toHaveCount(5);
    await open(page, "/skills-plugins");
    await expect(page.locator(".prompt-card")).toHaveCount(4);
    await page.locator('.subcategory-filter[data-subcategory="Plugin"]').click();
    await expect(cards(page)).toHaveCount(1);
  });

  test("the home hero's secondary button goes to /custom-agents", async ({ page }) => {
    await open(page, "/");
    const secondary = page.locator(".home-hero__actions a").nth(1);
    await expect(secondary).toHaveAttribute("href", "/custom-agents");
    await secondary.click();
    await expect(page).toHaveURL(/\/custom-agents$/);
  });
});
