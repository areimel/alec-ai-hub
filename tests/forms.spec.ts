import type { Page } from "@playwright/test";
import { expect, open, test } from "./helpers";

const forms = [
  {
    name: "submit-prompt",
    url: "/submit-prompt",
    form: "#promptSubmissionForm",
    result: "#promptSubmissionResult",
    firstInvalid: "#prompt-submitter-name",
    fill: async (page: Page) => {
      await page.locator("#prompt-submitter-name").fill("Test User");
      await page.locator("#prompt-submitter-email").fill("test@example.com");
      await page.locator("#prompt-title").fill("A $pecial title");
      await page.locator("#prompt-description").fill("Does a thing.");
      await page.locator("#prompt-category").selectOption("Coding");
      await page.locator("#prompt-platform").selectOption("Claude");
      await page.locator("#prompt-content").fill("Please do the thing.");
    },
    kept: ["#prompt-title", "A $pecial title"],
  },
  {
    name: "home contact",
    url: "/",
    form: "#form",
    result: "#result",
    firstInvalid: "#contact-name",
    fill: async (page: Page) => {
      await page.locator("#contact-name").fill("Test User");
      await page.locator("#contact-email").fill("test@example.com");
      await page.locator("#contact-message").fill("Hello there.");
    },
    kept: ["#contact-message", "Hello there."],
  },
];

for (const f of forms) {
  test.describe(f.name, () => {
    test("empty submit shows errors, focuses the first invalid field, sends nothing", async ({ page, mockWeb3forms }) => {
      const bodies = await mockWeb3forms();
      await open(page, f.url);
      await page.locator(`${f.form} button[type=submit]`).click();
      await expect(page.locator(f.firstInvalid)).toBeFocused();
      await expect(page.locator(`${f.form} .form-field__error`).first()).toBeVisible();
      await expect(page.locator(f.form)).toHaveClass(/was-validated/);
      expect(bodies).toEqual([]);
    });

    test("valid submit sends, reports success and resets", async ({ page, mockWeb3forms }) => {
      const bodies = await mockWeb3forms(200);
      await open(page, f.url);
      await f.fill(page);
      await page.locator(`${f.form} button[type=submit]`).click();
      await expect(page.locator(f.result)).toHaveAttribute("data-status", "success");
      expect(bodies).toHaveLength(1);
      expect(bodies[0]).toMatchObject({ access_key: expect.any(String) });
      await expect(page.locator(f.kept[0])).toHaveValue("");
    });

    test("a failed send reports an error and keeps the typed values", async ({ page, mockWeb3forms }) => {
      const bodies = await mockWeb3forms(500);
      await open(page, f.url);
      await f.fill(page);
      await page.locator(`${f.form} button[type=submit]`).click();
      await expect(page.locator(f.result)).toHaveAttribute("data-status", "error");
      expect(bodies).toHaveLength(1);
      await expect(page.locator(f.kept[0])).toHaveValue(f.kept[1]);
      await expect(page.locator(`${f.form} button[type=submit]`)).toBeEnabled();
    });
  });
}
