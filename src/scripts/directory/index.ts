// Search, filter, sort, paginate and card-copy behaviour for the directory pages (safe on a page without them).
import { copyWithConfirm } from "../copy";
import { matches, paginate, sortCards } from "./pipeline";
import { DEFAULTS, readState, writeState, type DirectoryState, type PerPage, type SortMode, type ViewMode } from "./state";

const DESKTOP = window.matchMedia("(min-width: 1024px)");

const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
const resetBtn = document.getElementById("resetFilters");
const toggle = document.getElementById("mobileMenuToggle");
const sidebar = document.getElementById("sidebarContent");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const grid = document.getElementById("promptsGrid");
const toolbar = document.getElementById("directoryToolbar");
const sortSelect = document.getElementById("sortSelect") as HTMLSelectElement | null;
const pageSizeSelect = document.getElementById("pageSizeSelect") as HTMLSelectElement | null;
const densityInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="density"]'));
const pagination = document.getElementById("pagination");

const cards = Array.from(document.querySelectorAll<HTMLElement>(".prompt-card"));
const categoryFilters = Array.from(document.querySelectorAll<HTMLElement>(".category-filter"));
const subcategoryFilters = Array.from(document.querySelectorAll<HTMLElement>(".subcategory-filter"));
const tagFilters = Array.from(document.querySelectorAll<HTMLElement>(".tag-filter"));

const state: DirectoryState = readState(new URLSearchParams(location.search));

/** Selected state lives in data-active (styled in hub.css) and aria-pressed. */
function setActive(button: HTMLElement, on: boolean) {
  if (on) button.dataset.active = "true";
  else delete button.dataset.active;
  button.setAttribute("aria-pressed", String(on));
}

function selectOnly(group: HTMLElement[], selected: HTMLElement | undefined) {
  group.forEach((btn) => setActive(btn, btn === selected));
}

const findCategory = (v: string) => categoryFilters.find((b) => b.dataset.category === v);
const findSub = (v: string) => subcategoryFilters.find((b) => b.dataset.subcategory === v);

function resetSubcategory() {
  state.sub = "all";
  selectOnly(subcategoryFilters, findSub("all"));
}

function resetTags() {
  state.tags = [];
  tagFilters.forEach((btn) => setActive(btn, false));
}

/** Only accept URL values that match an existing control; hydrate the UI to match state. */
function hydrate() {
  if (!findCategory(state.category)) state.category = DEFAULTS.category;
  if (!findSub(state.sub)) state.sub = DEFAULTS.sub;
  const known = new Set(tagFilters.map((b) => b.dataset.tag || ""));
  state.tags = state.tags.filter((t) => known.has(t));

  if (searchInput) searchInput.value = state.q;
  selectOnly(categoryFilters, findCategory(state.category));
  selectOnly(subcategoryFilters, findSub(state.sub));
  tagFilters.forEach((b) => setActive(b, state.tags.includes(b.dataset.tag || "")));

  if (sortSelect) {
    sortSelect.value = state.sort;
    if (sortSelect.value !== state.sort) state.sort = DEFAULTS.sort;
  }
  if (pageSizeSelect) {
    pageSizeSelect.value = String(state.per);
    if (pageSizeSelect.value !== String(state.per)) state.per = DEFAULTS.per;
  }
  densityInputs.forEach((r) => (r.checked = r.value === state.view));
  toolbar?.removeAttribute("hidden");
}

function pageItems(current: number, pages: number): (number | "gap")[] {
  const keep = new Set([1, pages, current - 1, current, current + 1].filter((n) => n >= 1 && n <= pages));
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

function renderPagination(current: number, pages: number) {
  if (!pagination) return;
  pagination.hidden = pages <= 1;
  if (pages <= 1) {
    pagination.replaceChildren();
    return;
  }
  const btn = (label: string, page: number, opts: { aria?: string; disabled?: boolean; current?: boolean } = {}) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pagination__btn";
    b.dataset.page = String(page);
    b.textContent = label;
    if (opts.aria) b.setAttribute("aria-label", opts.aria);
    if (opts.disabled) b.disabled = true;
    if (opts.current) b.setAttribute("aria-current", "page");
    return b;
  };
  const nodes: Node[] = [btn("Prev", current - 1, { aria: "Previous page", disabled: current <= 1 })];
  for (const item of pageItems(current, pages)) {
    if (item === "gap") {
      const gap = document.createElement("span");
      gap.className = "pagination__gap";
      gap.setAttribute("aria-hidden", "true");
      gap.textContent = "…";
      nodes.push(gap);
    } else {
      nodes.push(btn(String(item), item, { current: item === current }));
    }
  }
  nodes.push(btn("Next", current + 1, { aria: "Next page", disabled: current >= pages }));
  pagination.replaceChildren(...nodes);
}

function render() {
  const matched = cards.filter((c) => matches(c, state));
  const sorted = sortCards(cards, state.sort);
  const result = paginate(sortCards(matched, state.sort), state.per, state.page);
  state.page = result.page;
  const visible = new Set(result.items);

  grid?.append(...sorted);
  cards.forEach((card) => (card.style.display = visible.has(card) ? "" : "none"));
  if (grid) grid.dataset.density = state.view;

  if (resultCount) {
    const noun = resultCount.dataset.noun ?? "items";
    resultCount.textContent =
      result.pages <= 1
        ? `Showing ${matched.length} of ${cards.length} ${noun}`
        : `Showing ${result.start}–${result.end} of ${matched.length} ${noun}`;
  }
  if (emptyState) emptyState.hidden = matched.length !== 0;
  renderPagination(result.page, result.pages);
  writeState(state);
}

/** Any filter/search/sort/page-size change returns to page 1. */
function refilter() {
  state.page = 1;
  render();
}

function resetAll() {
  state.q = "";
  if (searchInput) searchInput.value = "";
  state.category = "all";
  selectOnly(categoryFilters, findCategory("all"));
  resetSubcategory();
  resetTags();
  refilter();
}

searchInput?.addEventListener("input", () => {
  state.q = searchInput.value.toLowerCase();
  refilter();
});

categoryFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectOnly(categoryFilters, button);
    state.category = button.dataset.category || "all";
    // Changing category clears the narrower filters.
    resetSubcategory();
    resetTags();
    refilter();
  }),
);

subcategoryFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectOnly(subcategoryFilters, button);
    state.sub = button.dataset.subcategory || "all";
    refilter();
  }),
);

tagFilters.forEach((button) =>
  button.addEventListener("click", () => {
    const tag = button.dataset.tag || "";
    const on = !state.tags.includes(tag);
    state.tags = on ? [...state.tags, tag] : state.tags.filter((t) => t !== tag);
    setActive(button, on);
    refilter();
  }),
);

resetBtn?.addEventListener("click", resetAll);

sortSelect?.addEventListener("change", () => {
  state.sort = sortSelect.value as SortMode;
  refilter();
});

pageSizeSelect?.addEventListener("change", () => {
  state.per = (pageSizeSelect.value === "all" ? "all" : Number(pageSizeSelect.value)) as PerPage;
  refilter();
});

densityInputs.forEach((radio) =>
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    state.view = radio.value as ViewMode;
    render();
  }),
);

pagination?.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-page]");
  if (!button || button.disabled) return;
  state.page = Number(button.dataset.page) || 1;
  render();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector(".directory__main")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  // render() rebuilt the buttons, so the clicked one is gone; move focus to the
  // top of the results (which now reads the new range) instead of dropping to <body>.
  if (resultCount) {
    resultCount.tabIndex = -1;
    resultCount.focus({ preventScroll: true });
  }
});

// Copy buttons on cards.
document.querySelectorAll<HTMLElement>(".copy-button").forEach((button) =>
  button.addEventListener("click", () => {
    const text = button.closest(".prompt-card")?.querySelector("pre")?.textContent || "";
    copyWithConfirm(button, text);
  }),
);

// Mobile filter panel: collapsed by default, always open on desktop.
function setOpen(open: boolean) {
  sidebar?.classList.toggle("hidden", !open);
  toggle?.setAttribute("aria-expanded", String(open));
}

toggle?.addEventListener("click", () => setOpen(sidebar?.classList.contains("hidden") ?? false));

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (!DESKTOP.matches && sidebar && !sidebar.classList.contains("hidden") && !target.closest("#sidebarContent") && !target.closest("#mobileMenuToggle")) {
    setOpen(false);
  }
});

DESKTOP.addEventListener("change", (e) => setOpen(e.matches));

hydrate();
render();
