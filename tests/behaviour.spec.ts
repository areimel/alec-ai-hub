import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { blockThirdParty, countPublishedEntries, expect, open, test } from "./helpers";

const diyContent = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/data/diyPromptLibrary.json", import.meta.url)), "utf8"),
) as {
  hero: { primary: { text: string }; secondary: { text: string } };
  statsLabels: { prompts: string; license: string };
  contact: { subject: string };
};

const cards = (page: import("@playwright/test").Page) => page.locator(".prompt-card:visible");
const DEFAULT_PAGE_SIZE = 24;

test.describe("directory filters", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/prompts");
  });

  test("search narrows cards, updates the count, shows the empty state and resets", async ({ page }) => {
    const total = countPublishedEntries("prompts");
    const firstPage = Math.min(total, DEFAULT_PAGE_SIZE);
    await expect(page.locator("#resultCount")).toHaveText(
      total > DEFAULT_PAGE_SIZE ? `Showing 1–${firstPage} of ${total} prompts` : `Showing ${total} of ${total} prompts`,
    );
    await page.locator("#searchInput").fill("react");
    const shown = await cards(page).count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    // Few enough matches for one page: "Showing N of M"; otherwise a range.
    await expect(page.locator("#resultCount")).toHaveText(
      shown < total && (await page.locator("#pagination").isHidden())
        ? `Showing ${shown} of ${total} prompts`
        : new RegExp(`^Showing 1–${shown} of ${total} prompts$`),
    );

    await page.locator("#searchInput").fill("zzzz-no-such-prompt");
    await expect(cards(page)).toHaveCount(0);
    await expect(page.locator("#emptyState")).toBeVisible();
    await expect(page.locator("#resultCount")).toHaveText(`Showing 0 of ${total} prompts`);

    await page.locator("#resetFilters").click();
    await expect(cards(page)).toHaveCount(firstPage);
    await expect(page.locator("#emptyState")).toBeHidden();
    await expect(page.locator("#searchInput")).toHaveValue("");
  });

  test("category, tool and tag filters work, combine and reset", async ({ page }) => {
    const total = countPublishedEntries("prompts");
    const firstPage = Math.min(total, DEFAULT_PAGE_SIZE);
    // Filters can match more cards than fit on one page.
    const visibleCount = async (attr: string, value: string) =>
      Math.min(await page.locator(`.prompt-card[${attr}="${value}"]`).count(), DEFAULT_PAGE_SIZE);

    // Category.
    const category = page.locator(".category-filter:not([data-category=all])").first();
    const categoryName = (await category.getAttribute("data-category"))!;
    await category.click();
    await expect(category).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.category-filter[data-category="all"]')).toHaveAttribute("aria-pressed", "false");
    await expect(cards(page)).toHaveCount(await visibleCount("data-category", categoryName));
    expect(await page.locator(`.prompt-card[data-category="${categoryName}"]`).count()).toBeLessThan(total);

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
    await expect(cards(page)).toHaveCount(Math.min(both, DEFAULT_PAGE_SIZE));

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
    await expect(cards(page)).toHaveCount(Math.min(expected, DEFAULT_PAGE_SIZE));
    await tag.click();
    await expect(tag).toHaveAttribute("aria-pressed", "false");

    // Search combined with the active filters.
    await page.locator("#searchInput").fill("zzzz-no-such-prompt");
    await expect(page.locator("#emptyState")).toBeVisible();

    // Reset restores everything.
    await page.locator("#resetFilters").click();
    await expect(cards(page)).toHaveCount(firstPage);
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

test.describe("directory view controls", () => {
  const total = countPublishedEntries("prompts");
  const published = (page: import("@playwright/test").Page) =>
    cards(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.published ?? ""));

  test.beforeEach(async ({ page }) => {
    await open(page, "/prompts");
    await expect(page.locator("#directoryToolbar")).toBeVisible();
  });

  test("density sets the first-row column count and survives reload", async ({ page }) => {
    const firstRowColumns = () =>
      cards(page).evaluateAll((els) => {
        const rects = els.map((e) => e.getBoundingClientRect());
        const top = rects[0].top;
        return new Set(rects.filter((r) => Math.abs(r.top - top) < 2).map((r) => Math.round(r.left))).size;
      });
    test.skip(total < 4, "needs at least four cards");
    const expected = { compact: 4, normal: 3, wide: 2 } as const;
    await expect(page.locator('input[name="density"]:checked')).toHaveValue("normal");
    await expect(page.locator("#promptsGrid")).toHaveAttribute("data-density", "normal");
    expect(await firstRowColumns()).toBe(3);
    for (const density of ["compact", "wide", "normal"] as const) {
      await page.locator(`input[name="density"][value="${density}"]`).check({ force: true });
      await expect(page.locator("#promptsGrid")).toHaveAttribute("data-density", density);
      expect(await firstRowColumns()).toBe(expected[density]);
    }
    await page.locator('input[name="density"][value="wide"]').check({ force: true });
    await expect(page).toHaveURL(/view=wide/);
    await page.reload();
    await expect(page.locator('input[name="density"][value="wide"]')).toBeChecked();
    await expect(page.locator("#promptsGrid")).toHaveAttribute("data-density", "wide");
  });

  test("sort orders visible cards by date and puts featured first", async ({ page }) => {
    test.skip(total < 2, "needs at least two cards");
    await page.locator("#sortSelect").selectOption("oldest");
    await expect(page).toHaveURL(/sort=oldest/);
    const asc = await published(page);
    expect(asc.length).toBeGreaterThan(1);
    expect(asc).toEqual([...asc].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()));

    await page.locator("#sortSelect").selectOption("newest");
    const desc = await published(page);
    expect(desc).toEqual([...desc].sort((a, b) => new Date(b).getTime() - new Date(a).getTime()));

    await page.locator("#sortSelect").selectOption("featured");
    const flags = await cards(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.featured === "true"));
    expect(flags).toEqual([...flags].sort((a, b) => Number(b) - Number(a)));
  });

  test("page size and Next paginate, and filters reset to page 1", async ({ page }) => {
    test.skip(total <= 12, "needs more than 12 cards");
    await page.locator("#pageSizeSelect").selectOption("12");
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator("#resultCount")).toHaveText(new RegExp(`^Showing 1–12 of ${total} prompts$`));
    await expect(page).toHaveURL(/per=12/);

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator("#resultCount")).toHaveText(/^Showing 13–/);
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('button.pagination__btn[data-page="2"]')).toHaveAttribute("aria-current", "page");

    // Changing a filter returns to page 1.
    await page.locator(".category-filter:not([data-category=all])").first().click();
    await expect(page).not.toHaveURL(/page=/);

    // Reset, then per=all hides pagination.
    await page.locator("#resetFilters").click();
    await page.locator("#pageSizeSelect").selectOption("all");
    await expect(page.locator("#pagination")).toBeHidden();
    await expect(cards(page)).toHaveCount(total);
    await expect(page).toHaveURL(/per=all/);
  });

  test("deep link restores sort, page size and page", async ({ page }) => {
    test.skip(total <= 12, "needs more than 12 cards");
    await open(page, "/prompts?sort=oldest&per=12&page=2");
    await expect(page.locator("#sortSelect")).toHaveValue("oldest");
    await expect(page.locator("#pageSizeSelect")).toHaveValue("12");
    await expect(page.locator("#resultCount")).toHaveText(/^Showing 13–/);
    await expect(page.locator('button.pagination__btn[data-page="2"]')).toHaveAttribute("aria-current", "page");
    const dates = await published(page);
    expect(dates).toEqual([...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()));
  });
});

test.describe("real data", () => {
  test("prompt directory shows one card per published prompt; home shows no counts", async ({ page }) => {
    await open(page, "/");
    await expect(page.locator(".stat-strip")).toHaveCount(0);
    await expect(page.locator("main")).not.toHaveText(/\d+ (prompts|agents|entries|published)/i);

    await open(page, "/prompts");
    // The JS pipeline pages the list, so only the first page is visible (all cards stay in the DOM).
    const total = countPublishedEntries("prompts");
    await expect(page.locator(".prompt-card:visible")).toHaveCount(Math.min(total, DEFAULT_PAGE_SIZE));
    await expect(page.locator("#resultCount")).toHaveText(new RegExp(`of ${total} prompts$`));
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
    const prompts = countPublishedEntries("prompts");
    await expect(page.locator(".prompt-card")).toHaveCount(prompts);
    await expect(page.locator(".prompt-card").first().locator("pre")).toBeAttached();
    await expect(page.locator("#searchInput")).toBeVisible(); // desktop width
    await expect(page.locator("#directoryToolbar")).toBeHidden();
    await expect(page.locator(".prompt-card:visible")).toHaveCount(prompts);

    await page.goto("/custom-agents/code-reviewer");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#promptContent")).toContainText(/\w{10}/);
  });

  test("mobile directory filters reachability without JS (informational)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/prompts");
    await expect(page.locator(".prompt-card")).toHaveCount(countPublishedEntries("prompts"));
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

  test("directories show every published agent and skill; the Plugin filter shows 1", async ({ page }) => {
    await open(page, "/custom-agents");
    await expect(page.locator(".prompt-card")).toHaveCount(countPublishedEntries("agents"));
    await open(page, "/skills-plugins");
    await expect(page.locator(".prompt-card")).toHaveCount(countPublishedEntries("skills"));
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

test.describe("DIY prompt library page", () => {
  const REPO_URL = "https://github.com/areimel/alec-ai-hub";
  const ZIP_URL = `${REPO_URL}/archive/main.zip`;

  test.beforeEach(async ({ page }) => {
    await open(page, "/diy-prompt-library");
  });

  test("hero primary CTA scrolls the quote form into view", async ({ page }) => {
    const primary = page.locator(".home-hero__actions a").nth(0);
    await expect(primary).toHaveText(diyContent.hero.primary.text);
    await expect(primary).toHaveAttribute("href", "#contact");
    await primary.click();
    await expect(page.locator("#contact #form")).toBeInViewport();
  });

  test("hero secondary CTA links to the paths section", async ({ page }) => {
    const secondary = page.locator(".home-hero__actions a").nth(1);
    await expect(secondary).toHaveText(diyContent.hero.secondary.text);
    await expect(secondary).toHaveAttribute("href", "#paths");
    await expect(page.locator("#paths")).toHaveCount(1);
  });

  test("the DIY card links to the repository and the ZIP download", async ({ page }) => {
    const card = page.locator(".diy-card--diy");
    await expect(card.locator(`a[href="${REPO_URL}"]`)).toHaveCount(1);
    await expect(card.locator(`a[href="${ZIP_URL}"]`)).toHaveCount(1);
  });

  test("stat strip shows a numeric prompt count and MIT as the license", async ({ page }) => {
    const statValue = (label: string) =>
      page
        .locator(".stat-strip > div", { has: page.locator("dt", { hasText: label }) })
        .locator("dd");
    await expect(statValue(diyContent.statsLabels.prompts)).toHaveText(/^\d+$/);
    await expect(statValue(diyContent.statsLabels.license)).toHaveText("MIT");
  });

  test("quote form has the setup subject and interest select; the homepage form has neither", async ({ page }) => {
    await expect(page.locator('#contact #form input[type="hidden"][name="subject"]')).toHaveValue(
      diyContent.contact.subject,
    );
    await expect(page.locator("select#contact-interest")).toHaveCount(1);

    await open(page, "/");
    await expect(page.locator('#form input[name="subject"]')).toHaveCount(0);
    await expect(page.locator("select#contact-interest")).toHaveCount(0);
  });

  test("both preview images have non-empty alt text", async ({ page }) => {
    const alts = await page
      .locator(".diy-preview img")
      .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).alt.trim()));
    expect(alts).toHaveLength(2);
    expect(alts.filter((alt) => alt === "")).toEqual([]);
  });

  test("no horizontal scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });
});
