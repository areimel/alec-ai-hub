// Search, filter and card-copy behaviour for the prompt and persona directories.
import { copyWithConfirm } from "./copy";

const DESKTOP = window.matchMedia("(min-width: 1024px)");

const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
const resetBtn = document.getElementById("resetFilters");
const toggle = document.getElementById("mobileMenuToggle");
const sidebar = document.getElementById("sidebarContent");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

const cards = Array.from(document.querySelectorAll<HTMLElement>(".prompt-card"));
const categoryFilters = Array.from(document.querySelectorAll<HTMLElement>(".category-filter"));
const subcategoryFilters = Array.from(document.querySelectorAll<HTMLElement>(".subcategory-filter"));
const tagFilters = Array.from(document.querySelectorAll<HTMLElement>(".tag-filter"));

let activeCategory = "all";
let activeSubcategory = "all";
const activeTags = new Set<string>();
let searchQuery = "";

/** Selected state lives in data-active (styled in hub.css) and aria-pressed. */
function setActive(button: HTMLElement, on: boolean) {
  if (on) button.dataset.active = "true";
  else delete button.dataset.active;
  button.setAttribute("aria-pressed", String(on));
}

function selectOnly(group: HTMLElement[], selected: HTMLElement | undefined) {
  group.forEach((btn) => setActive(btn, btn === selected));
}

function resetSubcategory() {
  selectOnly(subcategoryFilters, subcategoryFilters.find((b) => b.dataset.subcategory === "all"));
  activeSubcategory = "all";
}

function resetTags() {
  tagFilters.forEach((btn) => setActive(btn, false));
  activeTags.clear();
}

function parseTags(raw: string | undefined): string[] {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

function updateResults(shown: number) {
  const noun = resultCount?.dataset.noun ?? "items";
  if (resultCount) resultCount.textContent = `Showing ${shown} of ${cards.length} ${noun}`;
  if (emptyState) emptyState.hidden = shown !== 0;
}

function filterCards() {
  let shown = 0;
  cards.forEach((card) => {
    const title = (card.dataset.title || "").toLowerCase();
    const description = (card.dataset.description || "").toLowerCase();
    const tags = parseTags(card.dataset.tags);

    const visible =
      (searchQuery === "" || title.includes(searchQuery) || description.includes(searchQuery)) &&
      (activeCategory === "all" || card.dataset.category === activeCategory) &&
      (activeSubcategory === "all" || card.dataset.subcategory === activeSubcategory) &&
      (activeTags.size === 0 || tags.some((tag) => activeTags.has(tag)));

    card.style.display = visible ? "" : "none";
    if (visible) shown++;
  });
  updateResults(shown);
}

function resetAll() {
  if (searchInput) searchInput.value = "";
  searchQuery = "";
  selectOnly(categoryFilters, categoryFilters.find((b) => b.dataset.category === "all"));
  activeCategory = "all";
  resetSubcategory();
  resetTags();
  filterCards();
}

searchInput?.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase();
  filterCards();
});

categoryFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectOnly(categoryFilters, button);
    activeCategory = button.dataset.category || "all";
    // Changing category clears the narrower filters.
    resetSubcategory();
    resetTags();
    filterCards();
  }),
);

subcategoryFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectOnly(subcategoryFilters, button);
    activeSubcategory = button.dataset.subcategory || "all";
    filterCards();
  }),
);

tagFilters.forEach((button) =>
  button.addEventListener("click", () => {
    const tag = button.dataset.tag || "";
    const on = !activeTags.has(tag);
    if (on) activeTags.add(tag);
    else activeTags.delete(tag);
    setActive(button, on);
    filterCards();
  }),
);

resetBtn?.addEventListener("click", resetAll);

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

updateResults(cards.length);
