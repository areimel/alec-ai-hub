import { expect, test as base, type Page } from "@playwright/test";

export { expect };

export const WEB3FORMS = "https://api.web3forms.com/**";

type Fixtures = {
  /** Page errors and console errors seen so far. */
  errors: string[];
  /** Requests that reached web3forms without a mock. The test fails if any do. */
  unmocked: string[];
  /** Mock web3forms with the given status; returns the list of bodies it received. */
  mockWeb3forms: (status?: number) => Promise<unknown[]>;
};

export const test = base.extend<Fixtures>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });
    await use(errors);
  },

  unmocked: [
    async ({ context }, use) => {
      const hits: string[] = [];
      // Context routes run after page routes, so a page-level mock wins over this guard.
      await context.route(WEB3FORMS, (route) => {
        hits.push(route.request().url());
        return route.abort();
      });
      await use(hits);
      expect(hits, "unmocked request reached web3forms").toEqual([]);
    },
    { auto: true },
  ],

  mockWeb3forms: async ({ page }, use) => {
    await use(async (status = 200) => {
      const bodies: unknown[] = [];
      await page.route(WEB3FORMS, (route) => {
        bodies.push(route.request().postDataJSON());
        return route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ success: status < 400 }),
        });
      });
      return bodies;
    });
  },
});

/** Stub Google Tag Manager so it neither loads nor logs a network error. */
export async function blockThirdParty(page: Page) {
  await page.route("**/*googletagmanager.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
}

/** Goes to a path with GTM stubbed and waits until the navbar island has hydrated. */
export async function open(page: Page, url: string) {
  await blockThirdParty(page);
  const response = await page.goto(url);
  await expect(page.locator("header astro-island[ssr]")).toHaveCount(0);
  return response;
}

export async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
}
