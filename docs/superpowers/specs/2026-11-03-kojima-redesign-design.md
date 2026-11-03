# AI Hub redesign on the Kojima theme

## Context

AI Hub (`ai-hub.alecreimel.com`) still looks like a generic rounded blue-and-gray template, and its copy pitches a company product it isn't ("500+ Prompts", "Trusted by teams worldwide"; there are actually 19 prompts, 6 personas and 3 posts). Alec wants a full redesign using his Kojima theme: high-tech, spy agency, micro graphics.

**Intended outcome:** a personal public hub that looks like a Kojima instrument system, tells the truth about itself, and keeps every existing feature working: search and filters, copy buttons, fill-in templates, forms, blog, dark/light mode.

This file is both the design and the implementation plan. On approval, copy its design sections to `docs/superpowers/specs/2026-11-03-kojima-redesign-design.md` in the worktree and commit them.

## Decisions

**Alec's decisions**
- **Stack:** match Kojima, trimmed. Tailwind 4, React and only the shadcn parts we use.
- **Voice:** plain names with spy details. Nav, headings and buttons stay clear; the agency feel lives in micro-labels, plate captions and metadata. Brand stays AI Hub.
- **Homepage:** static instrument plates. No interactive instrument panel, so no palette, density or export controls and no fake signal feed.
- **Audience:** Alec's personal public hub. Remove inflated claims, show real counts, write in his voice.
- **Git:** fast-forward `github-pages-deploy` to `main` first, since PR #2 was merged and PR #3 is ahead of it. Then create the worktree from it; commit, merge back and remove the worktree when finished.
- **Newsletter:** remove the footer signup and its copy.
- **Placeholder prompts:** delete `sample-post-1`; keep `ai-prompt-template` as a real fill-in template credited to Alec, for 18 prompts.
- **Code structure:** follow DRY. Reuse components, consider a shared component for anything repeated 3+ times, and keep files under 300–400 lines. The goal is fewer components and lines, more consistent styling, and easier updates.
- **Commits:** 5–10+ descriptive commits along the way, so later sessions can use them as a timeline of checkpoints.

**Claude's calls (object to any on review)**
- Dark is the default, ignoring the system preference, with the light toggle kept. A saved `theme` choice still wins.
- No ambient animation, matching Kojima and the static-graphics decision. Only hover, focus and user-triggered state changes.
- Site name changes from "AI Prompt Library" to "AI Hub" in the wordmark and SEO titles.
- Remove the full-page loading overlay, which leaves the page blank without JS.
- Remove the footer social icons, whose links are all `#` placeholders.
- Keep Google Tag Manager, web3forms and all routes unchanged.
- Legal pages get new styling only; their text isn't touched. Blog post text isn't touched either.
- `/diy-prompt-library` keeps its own page and content, built from the same section components as the homepage. Those components take content as props, so changes to one page don't break the other.
- Keep `AnnouncementBanner`, restyled. Its only current announcement expired, so it renders nothing today.
- Replace any other leftover "Grovery Team" author credit with Alec Reimel; prompt text stays as it is.
- Remove the unused `@astrojs/netlify` package, since hosting is GitHub Pages.
- Merge locally only. **Nothing is pushed**, and `deploy.yml` deploys only from `main`, so this won't go live until Alec pushes and merges it.

## Design

**Tokens:** copied unchanged from Kojima's `kojima.css`.
- Charcoal `#141310`, panel `#1c1b17`, ivory `#efebe0`, safety orange `#ff4d00`, rule `#3f3b31`, muted `#aaa596`.
- Readable orange on ivory: `#b83200`.
- Radius 0, no shadows.

**Type:** DM Sans (self-hosted from Kojima) for headlines and body, tight tracking on display sizes. System monospace for technical labels, as in the theme.

**The memorable thing:** the instrument plates, used with real data. Everything around them stays quiet.
- Plates become parameterised: `InstrumentGraphic` gains props for wordmark, plate code and caption, so a plate can read `PROMPTS—18` and `AI HUB`, never `KOJIMA`.
- Counts come from the content collections at build time (drafts excluded), never hardcoded.
- Plates render on the server with no `client:` directive, so they ship zero JS.

**Micro-graphics:** registration marks, fine rules, technical grid, plate captions, and a small barcode generated from each entry's slug so every prompt has its own mark. Use only real metadata: category, AI tool, version, dates. Don't invent numbering such as `FILE 007`; marks are decoration, and sequence numbers appear only where content is a real sequence.

**Legibility floor:** Kojima's 7–9px labels are allowed only for decorative text. Anything a visitor needs to read (category, tags, version, dates, filters) is at least 11px, and body copy at least 14px.

**Homepage layout**
```
[eyebrow: Alec Reimel / AI working files              registration mark]
[H1 + short intro + Browse prompts / See personas]   [large orange radar plate]
[strip: real counts of prompts, personas, notes                         ]
[three plate links:  Prompts (radar) | Personas (matrix) | News & Tips (wave)]
[latest entries register: date / category / title, links, real data     ]
[how it works: find, fill in, copy (3-column ruled grid)                ]
[about panel: paper wave plate + first-person note                      ]
[FAQ (Radix accordion)]  [contact form]
[footer: giant AI HUB. wordmark                                         ]
```
Left-aligned throughout, on Kojima's 1440–1600px frame.

**Other pages**
- **Directory (`/prompts`, `/ai-personas`):** filter rail plus ruled file cards with category, tool, version, slug barcode and a scrollable prompt preview.
- **Detail pages:** a dossier sheet with a metadata rail and the prompt text as the main element; template fields sit above it. Both pages share one new component, since they differ by only about 30 diff lines.
- **Blog:** register-style index and themed `prose`. Existing images are kept.
- **Forms:** Kojima inputs and clear success and error messages, with the same web3forms behaviour.
- **404:** Kojima's "Signal not found" layout with AI Hub wording.

**Copy:** first person, plain, true. Rewrite `homeContent.json` and audit `diyPromptLibrary.json`. Remove the following:
- "500+ Prompts", "Trusted by teams worldwide" and "Growing Community"
- "Community Driven" and "our team"
- "several times per week" and "within 24 hours"

No marketing filler, and buttons say what they do.

## Technical approach

**Bring from Kojima** (fetch with `gh api`, public repo)
- `src/styles/kojima.css` unchanged, plus token, font and `@theme` sections of `global.css`
- `public/fonts/dm-sans/*`, and the favicon as a starting point
- `components/kojima/instrument-graphic.tsx`, adapted as above
- `blocks/navbar.tsx`, `blocks/footer.tsx`, `theme-toggle.tsx`, `background.tsx`, adapted
- `ui/{button,card,input,textarea,label,badge,accordion,separator}`, adding others only if a page needs them; `lib/utils.ts`
- The no-flash theme script from `BaseHead.astro`
- The relevant parts of `kojima-home.css`, moved into a new `src/styles/hub.css` for site composition
- `tests/kojima.spec.ts` and `playwright.config.ts`, adapted to our routes
- The Kojima license notice (MIT + Commons Clause), required for copied code, saved as `src/components/kojima/LICENSE`, with a README credit

**Configuration**
- `astro.config.mjs`: replace `@astrojs/tailwind` with the `@tailwindcss/vite` plugin; add `@astrojs/react`; keep `site`, static output and the passthrough image service.
- `tsconfig.json`: add `"@/*": ["*"]` alongside existing aliases, and `jsx: react-jsx` with `jsxImportSource: react`.
- Delete `tailwind.config.cjs`.
- Remove `@astrojs/tailwind`, `@fontsource-variable/*`, `astro-navbar`, `astro-icon` and `@iconify*` once nothing imports them. Icons move to `lucide-react`, including replacing the `bx:` names in the JSON data.
- `pnpm-workspace.yaml`: extend `allowBuilds` if pnpm asks for it. `pnpm-lock.yaml` must install with `--frozen-lockfile`, because CI (`withastro/action`) depends on it.
- Navigation data lives in `src/data/branding.json`, the existing pattern, and is read by both navbar and footer.

**Shell:** `src/layouts/Layout.astro` keeps its path and `title` prop, so pages don't change imports. It gets `<html data-theme="kojima" class="dark">`, a skip link, `<main id="main-content">`, and keeps `astro-seo`, GTM and `AnnouncementBanner`. React hydrates only for `Navbar client:load` and the FAQ accordion `client:visible`; everything else is static HTML.

**Traps to handle**
- **Script hooks must keep working.** Preserve these:
  - IDs: `searchInput`, `resetFilters`, `mobileMenuToggle`, `sidebarContent`, `copyPrompt`, `copyLink`, `promptContent`, `templateMenu`, `templateForm`, `resetTemplateBtn`, `applyTemplateBtn`, `form`, `result`, `promptSubmissionForm`, `promptSubmissionResult`
  - Classes: `.prompt-card`, `.category-filter`, `.subcategory-filter`, `.tag-filter`, `.copy-button`, `.form-group`, `.hidden` (sidebar), `.was-validated` (forms)
  - `.prompt-card` attributes: `data-category`, `data-subcategory`, `data-tags`, `data-title`, `data-description`
  - Removed with their features, so tests shouldn't expect them: `themeToggle`, `sun-icon`, `moon-icon`, `loading-overlay`, `.faq-content`, `.faq-icon`, `emailSignupForm`, `emailSignupResult`. Layout's overlay script goes too; `#main-content` stays as the skip-link target.
- **Scripts toggle colour classes** (blue, green and red `bg-*`, `text-*` and `hover:*` variants, plus generated class strings in `TemplateMenu.astro`). Replace these with one state contract styled in `hub.css`, with no new colour classes:
  - `data-active="true"` for selected filters
  - `data-copied="true"` for copy confirmation
  - `data-status="pending|success|error"` for form messages
- **Scoped `@apply` fails in Tailwind 4** (`SearchFilter.astro`, `AnnouncementBanner.astro`, where `ring-opacity-50` is also gone). Check all nine `<style>` blocks and remove or rewrite them against CSS variables.
- **Theme key:** the toggle lives inside the navbar island and keeps the existing `localStorage` key `theme` with `dark` or `light`, so a returning visitor's choice carries over.
- **The kept template:** check that `ai-prompt-template`'s `[important rule]` blanks match the placeholder format `TemplateMenu` parses, and set `template: true`. If they differ, convert the blanks to the supported format.
- **`useId` across separate Astro renders:** confirm the plates' SVG IDs don't collide when several appear on one page, and fix them with a seed-based ID if they do. The test suite asserts no duplicate IDs.
- **Typography:** map `--tw-prose-*` to theme tokens so blog text is readable in both modes.
- **Chrome crash:** the Playwright MCP browser crashes on launch on this machine (GLib settings schema error). Test with Playwright's bundled Chromium via `npx playwright install chromium`; use Claude in Chrome as the fallback for visual review.

**Cleanup:** the Legal + sweep agent proposes deletions after page agents finish, and Claude deletes only what nothing imports. Candidates:
- `components/deprecated/*`, `hero`, `features`, `cta`, `sectionhead` (after `blog/index` and `submit-prompt` stop using it)
- `navbar/*`, `footer.astro`, `ThemeToggle.astro`, `FooterNewsletterForm.astro`, and old `ui/*.astro` and `ui/icons/*` (the old `ui/button.astro` must not coexist with `ui/button.tsx`)
- `src/assets/hero*`, `public/Placeholder-Logo-*`, the empty `team` collection in `content/config.ts`, and `src/utils/all.js` unless still used

**DRY rules (apply to every agent)**
- Search for an existing component before writing a new one. Check `ui/*` and the shared list below first.
- If something repeats 3+ times and represents the same rule, centralize it. Leave code alone when it only looks similar but would change for different reasons.
- Keep files under 300–400 lines, splitting by responsibility. `SearchFilter.astro` (297 lines) is the one to watch, and any script that outgrows its component moves to `src/scripts/`.
- Don't copy Kojima parts we won't use. Each `ui/*` file needs a real caller.
- Style through theme tokens and shared classes; avoid one-off colours and repeated long class strings.

**Planned shared pieces** (the Foundation and Shell agents create these first, so page agents reuse them)
- `TechLabel`: the mono micro-label, including the legibility floor
- `PlateLink`: plate plus caption, used on the homepage and index pages
- `EntryRegister`: date, category and title rows, used for homepage latest entries and the blog index
- `EntryDossier`: the shared detail page for prompts and personas
- `src/scripts/copy.ts`: one copy-and-confirm helper replacing the near-identical handlers in `PromptCard`, `prompts/[slug]`, `ai-personas/[slug]` and `TemplateMenu`
- `src/scripts/web3form.ts`: one submit-and-status helper replacing the handlers in the two remaining forms; they implement the same flow, so this is true duplication even at two uses
- A shared collection helper for "published, newest first" and counts, used by the directory, homepage and plates

The Review agent checks the finished diff against these rules and reports any file over 400 lines. The final report compares component count and lines of code before and after; both should fall where possible, excluding copied `ui/*` files, which are counted separately.

## Execution

**Worktree**
```bash
git merge --ff-only main   # on github-pages-deploy
git worktree add ../alec-ai-hub-kojima -b kojima-redesign github-pages-deploy
```
It's a sibling folder, so nothing needs gitignoring. Run `pnpm install` and a baseline `pnpm build` there first. `HOSTING_MANUAL_STEPS.md` stays untracked in the main checkout and isn't touched.

**Coordination:** Claude keeps the TODO list, runs integration and makes all commits. Agents don't commit, and each owns only its listed files, so parallel work can't conflict. Before dispatching page agents, Claude checks `docs/preview-desktop.png` from the theme repo for reference. Ten agents are enough of the 30 allowed.

| Phase | Agent | Model | Owns |
|---|---|---|---|
| 1 (alone) | Foundation | Sonnet | Dependencies, Astro/TS config, Tailwind 4 migration, theme CSS, fonts, `ui/*`, `lib/utils`, license |
| 2 (parallel) | Graphics | Sonnet | `InstrumentGraphic`, slug barcode, favicon, new `opengraph.jpg` rendered from a plate SVG with `sharp`, and its alt text in `branding.json` (coordinated through Claude) |
| 2 | Shell | Sonnet | `Layout`, `container.astro` (moved to the Kojima frame), navbar, footer, toggle, banner, `branding.json`, 404 |
| 3 (parallel) | Home + DIY | Sonnet | `index`, `diy-prompt-library`, `Landing*`, `homeContent.json`, `diyPromptLibrary.json`, `hub.css` composition sections |
| 3 | Directory | Sonnet | `SearchFilter`, `PromptCard`, `PromptGrid`, `PromptDirectoryGroup`, `HomeHeaderSection`, both index pages |
| 3 | Detail | Sonnet | Shared dossier component, both `[slug]` pages, `TemplateMenu`, `CopyButton`, the two placeholder prompt files and author credits |
| 3 | Forms | Sonnet | `contactform`, `PromptSubmissionForm`, `src/scripts/web3form.ts`, `submit-prompt` |
| 3 | Blog | Haiku | `BlogLayout`, blog index and `[slug]`, prose styles |
| 3 | Legal + sweep | Haiku | `privacy`, `terms`, `ccpa`, unused-component and leftover-colour report |
| 4 | Tests | Sonnet | `tests/`, Playwright config; reports failures |
| 4 | Review | Sonnet | Independent read-only review of the full diff |

**Commit timeline:** each commit is a working checkpoint that passes `pnpm build`, with a message saying what changed and why. Claude commits as each agent's work is integrated, rather than in one batch per phase:

1. Design spec and TODO list
2. Tailwind 4, React and theme foundation
3. Shared UI primitives and centralized micro-labels
4. Instrument plates, slug barcode and site graphics
5. Site shell: layout, navbar, footer, 404
6. Homepage and DIY page, with truthful copy
7. Prompt and persona directories
8. Shared detail page and templates
9. Forms
10. Blog and legal pages
11. Remove unused components and packages
12. Tests, then review fixes as separate commits

**Close-out**
```bash
git -C <main checkout> switch github-pages-deploy
git -C <main checkout> merge --no-ff kojima-redesign
git worktree remove ../alec-ai-hub-kojima
git branch -d kojima-redesign
```
Rerun `pnpm install --frozen-lockfile && pnpm build` on the merged result, then confirm with `git worktree list`.

## Verification

1. `pnpm install --frozen-lockfile && pnpm build` succeeds from clean, and the page count is the baseline minus one (`sample-post-1` is removed).
2. Playwright against the production build, for every route type (prompt and persona detail sampled via one template and one non-template page, plus blog, forms, legal, 404), in dark and light:
   - One `h1`, no axe WCAG A/AA violations, no console errors.
   - No horizontal scroll at 320, 390, 768 and 1440px; no duplicate IDs.
3. Behaviour tests:
   - Search, category, tool and tag filters, plus reset.
   - Copy on cards and on detail pages (clipboard contents and the confirmation state).
   - Template fields update the prompt, and reset restores it.
   - Theme persists after reload, mobile nav closes on Escape, and the FAQ opens by keyboard.
   - Forms validate and show success and error states, with the web3forms request mocked so no real submissions go out.
4. Page content is readable with JavaScript disabled.
5. Greps come back empty in `src`, excluding the license and credit:
   - `KOJIMA`/`Kojima` as visible text
   - `bg-gray-|bg-blue-|text-gray-|text-blue-|rounded-lg|shadow-`
   - `500+`, `Trusted by`, `within 24 hours`, `Grovery`, `emailSignup`
6. Screenshots of home, directory, detail and a form at desktop and mobile, in both themes, reviewed by Claude against this design. Fix what reads as templated or illegible, and remove one decoration if a page feels busy.
7. Final report states what passed, what didn't, and that nothing was pushed.

## TODO

Baseline before this work: 38 built pages, 51 files across `src/components`, `src/layouts` and `src/pages`, 4,130 lines of source (`.astro`, `.ts`, `.js`, `.json`).

- [x] 1. Design spec and TODO list
- [x] 2. Tailwind 4, React and theme foundation (Foundation)
- [x] 3. Shared UI primitives (Foundation)
- [x] 4. Instrument plates, slug barcode and site graphics (Graphics)
- [x] 5. Site shell: layout, navbar, footer, 404 (Shell)
- [x] 6. Homepage and DIY page, with truthful copy (Home + DIY)
- [x] 7. Prompt and persona directories (Directory)
- [x] 8. Shared detail page and templates (Detail)
- [x] 9. Forms (Forms)
- [x] 10. Blog and legal pages (Blog, Legal + sweep)
- [x] 11. Remove unused components and packages (Legal + sweep, Claude)
- [x] 12. Tests, independent review and fixes (Tests, Review)
