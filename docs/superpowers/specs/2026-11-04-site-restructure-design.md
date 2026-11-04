# Site Re-Structure: Prompts, Custom Agents, Skills & Plugins

## Context

AI Hub currently offers Prompts, AI Personas, News & Tips and a DIY guide. Alec wants it refocused on three copyable resource types, with the site promoting his portfolio and the open-source repo instead of pointing people at another internal page.

New structure:

- Home
  - Prompts (`/prompts`, unchanged)
  - Custom Agents (`/custom-agents`, replaces AI Personas)
  - Skills & Plugins (`/skills-plugins`, new)

## Decisions

**Alec's decisions**
- "Newsletter pages" means the News & Tips blog. Delete `/blog`, its 3 posts and all links. Old URLs redirect to home.
- Custom Agents gets newly written agent definitions. The 6 personas are retired, not relabelled.
- Skills & Plugins launches with drafted starter entries.
- DIY Prompt Library stays live, with a footer link only.
- Header, footer and mobile nav all reflect the new pages.
- CTA buttons: portfolio (`https://alecreimel.com/`) and GitHub repo (`https://github.com/areimel/alec-ai-hub`).
- 3-5+ commits, using a mix of Sonnet and Haiku subagents (up to 10).

**My calls, to check at review**
- The CTA swap applies to the header and mobile menu, where the "Browse prompts" button sits today. The home hero keeps "Browse prompts" as its primary button and changes "See personas" to "See custom agents", so the hero still leads into the content. The 404 page also keeps its "Browse prompts" link.
- The entries are Claude Code format: agents are subagent files and skills are `SKILL.md` files. The plugin entry describes a plugin's file layout and manifest.
- Starter content is drafted by AI and published under Alec's name, so Alec needs to read it before merging. Nothing goes live until `main` is pushed.
- Work happens on branch `site-restructure`, because pushing to `main` deploys. No push or PR without asking.
- Retired persona URLs (index and 6 detail pages) redirect to `/custom-agents`.

## Implementation

### 1. Shared directory config
Personas and prompts are currently split by `isPersonas` ternaries across `PromptCard`, `PromptGrid`, `PromptDirectoryGroup`, `SearchFilter` and `EntryDossier`. A third type makes this worth centralizing.

Add `src/lib/collections.ts`, keyed by `prompts | agents | skills`, holding: base path, noun, view and copy labels, sub-category label, "all" filter label, search placeholder, detail-page text heading, back link. Those five components read from it. `src/lib/content.ts` updates its `PublishedCollection` type and `getCounts()` to the three new collections.

Keep the existing filter, card and dossier markup and `src/scripts/directory-filters.ts` behaviour (only its header comment changes). `/prompts` must not change visibly: compare the `.directory` markup in its built HTML before and after, and they should match. Update the `collectionType` and `CollectionEntry` type unions in all five components, and move the `personas` references in `src/pages/index.astro` to `agents` in this same step so the build keeps passing.

Entry defaults for all 9 new entries: `publishDate` and `lastUpdated` of `2026-11-03 12:00` (`getPublished` drops anything not yet published), `author: "Alec Reimel"`, `version: "1.0"`, `featured: false`, no `template` field (my calls).

### 2. Custom Agents
- `src/content/config.ts`: replace `personas` with `agents`, using the same field shape as prompts. `category`: `Code | Research | Writing | Operations`. `sub_category`: `Read-only | Can edit`, labelled "Access".
- Delete `src/content/personas/` and `src/pages/ai-personas/`.
- Add `src/pages/custom-agents/index.astro` and `[slug].astro`, following the old persona pages.
- Add 5 entries in `src/content/agents/*.md`: Code Reviewer, Bug Investigator, Codebase Explorer, Test Writer, Docs Writer. Use `.md`, not `.mdx`, because bodies are shown raw and contain `<`, `{` and frontmatter. Each body is a complete, ready-to-save agent file. `usage_instructions` says where to save it.

### 3. Skills & Plugins
- `src/content/config.ts`: add `skills`, same field shape. `category`: `Code | Writing | Docs | Workflow`. `sub_category`: `Skill | Plugin`, labelled "Type".
- Add `src/pages/skills-plugins/index.astro` and `[slug].astro`.
- Add 4 entries in `src/content/skills/*.md`: Commit Message Writer, PR Description Writer and Changelog Writer (skills), plus one plugin that bundles those three skills, showing its directory layout and `plugin.json`.
- Before writing agents and skills, confirm current file formats with the `claude-code-guide` agent. Entries must be original, not copied from installed skills.

### 4. Remove the blog
Delete `src/pages/blog/`, `src/content/blog/`, `src/layouts/BlogLayout.astro`, `src/styles/hub/blog.css` (and its import in `src/styles/hub.css`), and the `blog` collection. Before deleting the CSS, confirm the legal pages' `.prose` styles live elsewhere, and update the "blog posts and legal pages" comment at `src/styles/hub.css:104`. Delete the blog-only images `public/ai-personas.jpg`, `public/post-free-copy.jpeg` and `public/post-templates.jpg`. Keep `src/utils/all.js` and `EntryRegister.astro`, because the home page's "Recently added" list uses them. Remove the expired announcement from `src/data/announcements.json`, which links to a post, leaving the array empty because `AnnouncementBanner.astro` still reads the file.

### 5. Redirects
Add `redirects` to `astro.config.mjs`. The site is static on GitHub Pages, so Astro emits meta-refresh pages:
- `/blog` and the 3 post URLs → `/`
- `/ai-personas` and the 6 persona URLs → `/custom-agents`

Each redirect lands in the same commit that deletes its page files, because Astro's `redirects` conflict with a page at the same path: persona redirects with commit 2, blog redirects with commit 4. Confirm redirect pages are absent from the sitemap.

### 6. Navigation and CTAs
- `src/data/branding.json`: `navigation.main` becomes Prompts, Custom Agents, Skills & Plugins. Add `navigation.cta` with the portfolio and GitHub links. `navigation.footer` gains DIY Prompt Library.
- `src/components/blocks/navbar.tsx`: replace the "Browse prompts" link in both the desktop and mobile blocks with both CTAs, rendered from `navigation.cta`. Portfolio is filled and GitHub is outlined. Both open in a new tab with `rel="noopener noreferrer"`.
- `src/components/blocks/footer.tsx`: reads the updated data. Add the GitHub repo link to the "More" row.
- Header CTAs show from `lg` up (`hidden lg:inline-flex`, today's is `sm`). Below `lg` they appear only in the mobile menu, so the two buttons never duplicate the menu's copies and never crowd the header at tablet widths (my call). Check header fit at 1024px, where the wordmark, nav, theme toggle and two buttons compete for width.

### 7. Home page and copy
- `src/pages/index.astro`: stats, plates and "Recently added" become prompts, agents and skills. The third plate (wave/orange) becomes Skills & Plugins.
- `src/data/homeContent.json`: hero, plates, features, about and FAQ copy. Remove "personas" and "a few posts", and extend "How it works" beyond prompts where it would otherwise be untrue.
- `src/data/branding.json`: tagline, footer note, descriptions, SEO.
- `src/data/diyPromptLibrary.json`, `src/components/kojima/instrument-graphic.tsx` default footer lines, `src/assets/opengraph-source.svg`. Regenerate the OG image with `node scripts/render-og.mjs`.
- `README.md` and `.kiro/steering/*`: updated to match. The dated redesign spec stays as history.
- Keep the voice plain and first-person, with no inflated claims, per `docs/superpowers/specs/2026-11-03-kojima-redesign-design.md`.

### 8. Tests
- `tests/helpers.ts`: remove `blogSlugs` and any imports it leaves unused. It reads `src/content/blog` at load, so every spec fails until this is done. The suite is therefore only expected to pass from the tests commit on; earlier commits are checked with `pnpm build`.
- `tests/accessibility.spec.ts`: replace blog and persona routes with new directories and sample detail pages.
- `tests/behaviour.spec.ts` (test at ~246): update the nav hrefs on line ~249, and replace the blog post check on lines ~262-264 with an agent detail page check, since `.post-body` goes away.
- New tests: both CTAs (href, new tab) on desktop and in the mobile menu; DIY link in the footer but not the header; a sample of old URLs redirecting; copy button works on an agent and a skill.

## Execution

Sequential where work depends on it, parallel otherwise. I commit between stages, and agents don't commit.

| Stage | Agent | Model | Tasks |
|---|---|---|---|
| 1 | Foundation | Sonnet | Section 1, schemas and page routes from 2 and 3, persona redirects |
| 2 (parallel) | Agents content | Sonnet | Format check, 5 agent entries |
| 2 | Skills content | Sonnet | Format check, 4 skill and plugin entries |
| 2 | Blog removal | Haiku | Section 4 and blog redirects |
| 3 (parallel) | Nav and CTAs | Sonnet | Section 6 |
| 3 | Home page and copy | Haiku | Section 7 |
| 4 | Tests | Sonnet | Section 8, run the suite, fix failures |
| 5 | Review | Sonnet | Fresh code review of the branch diff |

### Planned commits
1. Add design doc (copy of this plan to `docs/superpowers/specs/2026-11-04-site-restructure-design.md`)
2. Generalize directory components and add Custom Agents, replacing personas
3. Add Skills & Plugins directory and starter entries
4. Remove the News & Tips blog and redirect old URLs
5. Update header, footer and mobile nav, and add portfolio and GitHub CTAs
6. Update home page, site copy and OG image
7. Update tests and README for the new structure

## Verification

- `pnpm build` passes, and `dist/` has no `/blog` or `/ai-personas` content pages beyond redirect stubs.
- `pnpm test:e2e` passes in full (accessibility, behaviour, forms).
- Search `src/` and `tests/` for `persona`, `/blog`, `News & Tips` and `Browse prompts`. Only the intended hero and 404 uses of "Browse prompts" and the privacy page's "no newsletter" line should remain.
- Browser check with Playwright against `pnpm preview`: home, both new directories, one detail page each, redirects, the mobile menu at 390px and 768px, header at 1024px, light and dark themes.
- Check that every link in the built header and footer resolves.
