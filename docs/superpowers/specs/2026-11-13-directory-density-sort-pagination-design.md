# Directory pages: full-width layout, card density, sort, pagination (design)

## Context
The three directory pages (`/prompts`, `/skills-plugins`, `/custom-agents`) sit inside a 1600px container. The 16rem filter rail and the grid share that space, and the grid only shows 2 columns from 1280px up. Alec wants:
- more of the screen used and more content per screen
- a card density switch: Compact (4 per row), Normal (3), Wide (2)
- sort and page-size controls, which don't exist yet

**Decisions Alec made:**
- **Sort options:** Newest (default), Oldest, Featured first.
- **Page size:** 12 / 24 / 48 / All, with numbered pagination (Prev · 1 2 3 · Next).
- **State:** kept in URL params so a view can be shared and survives a refresh.
- **Default density:** Normal (3 per row).
- **Page header:** goes full-width with the directory.

**My calls (open to change):**
- **Default page size:** 24, because 12, 24 and 48 divide evenly by 4, 3 and 2, so full pages never end on a half-empty row.
- **History:** URL updates use `replaceState`, so filtering doesn't flood the back button.
- **Narrow screens:** density is a *maximum* column count. Columns step down as the main area narrows.
- **No JavaScript:** without JS the toolbar and pagination stay hidden and every card renders, as today.

## Existing pieces to reuse
- **Page shell:** `src/components/PromptComponents/PromptDirectoryGroup.astro` holds the rail and main area. `PromptGrid.astro` holds `#resultCount`, `#emptyState` and `#promptsGrid`. `PromptCard.astro` renders `.prompt-card` with `data-*` attributes.
- **Filter script:** `src/scripts/directory-filters.ts` is plain TS with module state. It uses `setActive`/`selectOnly`, `parseTags` and `copyWithConfirm` (from `./copy`), and handles the mobile toggle.
- **Server-side order:** `src/lib/content.ts` `getPublished()` already sorts newest first. The original DOM index is the tie-breaker.
- **Width limits:** `src/components/container.astro` (`max-w-[1600px] px-5 md:px-10`) is used by `PageHeader.astro`.
- **Styles:** `src/styles/hub/directory.css`, with tokens `--border`, `--card`, `--muted-foreground`, `--font-mono`, `--kojima-accent-ink` and `.technical-label`.
- **Tests:** `tests/behaviour.spec.ts` and `tests/accessibility.spec.ts`. The accessibility tests cover overflow at 320, 390, 768 and 1440px, axe, and both themes.

## Design

### 1. Full-width layout
- **`Container`:** add a `width?: "default" | "full"` prop. `full` sets no max-width with gutters of `px-4 md:px-6 xl:px-8`.
- **`PageHeader`:** add a matching `width` prop that it passes to `Container`.
- **The 3 directory pages:** use `width="full"`. Other pages stay unchanged.
- **`.directory` at 1024px and up:** columns become `17rem minmax(0,1fr)`. The rail sits flush against the left gutter with a `border-right: 1px solid var(--border)` that runs the full height of the rail, and a `padding-right`. It stays sticky with its own scroll.
- **Mobile:** stacking and the toggle stay as they are.

### 2. Toolbar (new `DirectoryToolbar.astro`, rendered by `PromptGrid` above the grid)
- **Row layout:** `#resultCount` on the left; the controls on the right in a `#directoryToolbar` row that wraps on narrow screens.
- **Sort:** `<label>Sort</label><select id="sortSelect">` with `newest` / `oldest` / `featured`.
- **Per page:** `<label>Per page</label><select id="pageSizeSelect">` with `12` / `24` / `48` / `all`.
- **Density:** `<fieldset id="densityControl"><legend class="sr-only">Card size</legend>` with three `input[type=radio][name=density]` values (`compact`, `normal`, `wide`), shown as a segmented control. Each segment has a tiny column glyph (4, 3 or 2 bars drawn with CSS) plus the text label.
  - This is the one distinctive element on the page.
  - Focus is visible. The control is hidden when the main area is below about 560px wide (container query), because the grid is 1 column there anyway.
- **Look:** square edges, 1px `--border`, `.technical-label` type, and `--kojima-accent-ink` for the selected state, so it matches the existing Kojima style.
- **Without JS:** the toolbar controls carry `hidden` and the script removes it.

### 3. Grid density (CSS in `directory.css`, `.directory-grid` block)
- **Container queries:** `.directory__main { container-type: inline-size }`. `#promptsGrid[data-density]` defaults to `normal`.
- **Breakpoints by main-area width:**

  | Density | 1 column | 2 columns | 3 columns | 4 columns |
  |---|---|---|---|---|
  | Compact | below 560px | from 560px | from 860px | from 1120px |
  | Normal | below 640px | from 640px | from 980px | — |
  | Wide | below 720px | from 720px | — | — |

- **Compact cards:** shorter preview (10rem instead of 14rem) and slightly smaller padding and title.
- **Borders:** the existing border pattern (grid draws top and left, each card draws right and bottom) works with any column count.

### 4. Pagination (new `DirectoryPagination.astro` below the grid)
- **Markup:** `<nav id="pagination" aria-label="Pagination" hidden>`. The script renders Prev, the page numbers with ellipses (`1 … 4 5 6 … 10`) and Next as `<button>`s, with `aria-current="page"` on the current one.
- **Hidden when:** there's only one page or page size is All.
- **Changing page:** scrolls `.directory__main` into view, with smooth scrolling only when reduced motion is off.

### 5. Script: filter → sort → paginate → render
Split `directory-filters.ts` into `src/scripts/directory/`:
- **`state.ts`:** the `DirectoryState` type and defaults, plus `readState(URLSearchParams)` and `writeState(state)`.
  - Params: `q`, `category`, `sub`, `tags` (comma-separated), `sort`, `per`, `page`, `view`.
  - Default values are left out of the URL. Invalid values fall back to the default.
- **`pipeline.ts`:** pure functions `matches(card, state)`, `sortCards(cards, sort)` and `paginate(list, per, page)`, which returns the slice plus `{start, end, pages}` with the page clamped into range.
- **`index.ts`:** the entry point. It wires up the existing filter buttons, search, reset, copy and the mobile toggle (moved over unchanged), plus the new controls.
  - **Startup:** hydrate state from the URL, including setting the active filter buttons and the input value.
  - **Render:** re-append cards in sorted order to `#promptsGrid`, then set `display:none` on cards that don't match or are off the current page.
  - **Page reset:** any change to filters, search, sort or page size sets `page=1`.
- **`PromptCard`:** add `data-published={publishDate ISO}` and `data-featured`. The Featured sort puts featured cards first, then newest.
- **Result count:**
  - One page: `Showing N of M {noun}` (current format).
  - Multiple pages: `Showing 25–48 of N {noun}`, where N is the number of matching cards.
- **`SearchFilter.astro`:** point its `<script>` import at the new entry point. Delete the old file.

## Execution: TODO list and subagents (worked in a single tree, I commit between waves)

| # | Task | Agent | Files |
|---|---|---|---|
| 0 | Write this design to `docs/superpowers/specs/2026-11-13-directory-density-sort-pagination-design.md` | Haiku | docs |
| 1 | Full-width layout (§1) | Haiku | `container.astro`, `PageHeader.astro`, 3 `index.astro` pages, `.directory`/rail block of `directory.css` |
| 2 | Toolbar + pagination markup and CSS, density container queries (§2–4) | Sonnet (frontend-design guidance) | `DirectoryToolbar.astro`, `DirectoryPagination.astro`, `PromptGrid.astro`, `.directory-grid` and new control styles in `directory.css` |
| 3 | Script refactor + sort/paginate/URL logic, card data attributes (§5) | Sonnet | `src/scripts/directory/*`, `PromptCard.astro`, `SearchFilter.astro` |
| 4 | Update and add Playwright tests | Sonnet | `tests/behaviour.spec.ts`, `tests/accessibility.spec.ts` |
| 5 | Build, run e2e and a11y, take screenshots at 390, 1024, 1440 and 1920px across densities | Haiku | — |
| 6 | Code review of the full diff | Sonnet (`feature-dev:code-reviewer`) | — |

**Waves:**
- **Wave A (parallel):** 0, 1, 2 and 3. Every agent gets the shared contract: the IDs `#directoryToolbar`, `#sortSelect`, `#pageSizeSelect`, `input[name=density]`, `#pagination`, `#promptsGrid[data-density]`, the URL param names, and which regions of `directory.css` it owns.
- **Wave B:** 4 and then 5.
- **Wave C:** 6. I apply the fixes.

**Commits (each on main, descriptive):**
1. `Add design spec for directory density, sort and pagination`
2. `Make directory pages full-width with left-pinned filter rail`
3. `Add directory toolbar with density switch and grid container queries`
4. `Refactor directory script into filter/sort/paginate pipeline with URL state`
5. `Add numbered pagination and page-size control to directories`. If tasks 2 and 3 land together, 3 and 5 split by feature.
6. `Update e2e tests for sort, density, pagination and URL state`
7. `Fix review findings` (if any)

## Verification
- **Build:** `pnpm build` passes with no type errors.
- **Existing tests:** `pnpm test:e2e` passes. Tests that check the count text are updated for the page-size default, and the no-JS tests still see every card.
- **New tests:**
  - **Density:** each option gives 4, 3 or 2 columns at 1440px (checked with the card bounding boxes), and the choice survives a reload through `?view=`.
  - **Sort:** Oldest reverses the order; Featured puts `data-featured` cards first.
  - **Pagination:** a page size of 12 shows 12 cards and the Next button works; filtering resets to page 1; All hides the nav.
  - **URL state:** `?category=…&tags=…&sort=oldest&page=2` restores the full state.
- **Accessibility:** axe passes in both themes, with no horizontal overflow at 320 to 1440px.
- **Visual check:** Playwright screenshots at 1440 and 1920px for each density, plus mobile at 390px. Review against the existing Kojima look.
