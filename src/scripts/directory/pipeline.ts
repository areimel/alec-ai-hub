// Pure filter / sort / paginate helpers operating on card elements.
import type { DirectoryState, PerPage, SortMode } from "./state";

function parseTags(raw: string | undefined): string[] {
  try {
    return JSON.parse(raw || "[]") as string[];
  } catch {
    return [];
  }
}

export function matches(card: HTMLElement, s: DirectoryState): boolean {
  const q = s.q.toLowerCase();
  const title = (card.dataset.title || "").toLowerCase();
  const description = (card.dataset.description || "").toLowerCase();
  return (
    (q === "" || title.includes(q) || description.includes(q)) &&
    (s.category === "all" || card.dataset.category === s.category) &&
    (s.sub === "all" || card.dataset.subcategory === s.sub) &&
    (s.tags.length === 0 || parseTags(card.dataset.tags).some((t) => s.tags.includes(t)))
  );
}

function time(card: HTMLElement): number {
  const t = Date.parse(card.dataset.published || "");
  return Number.isNaN(t) ? 0 : t;
}

export function sortCards(cards: HTMLElement[], sort: SortMode): HTMLElement[] {
  const indexed = cards.map((card, i) => ({ card, i, t: time(card), f: card.dataset.featured === "true" }));
  indexed.sort((a, b) => {
    if (sort === "featured" && a.f !== b.f) return a.f ? -1 : 1;
    const d = sort === "oldest" ? a.t - b.t : b.t - a.t;
    return d || a.i - b.i;
  });
  return indexed.map((x) => x.card);
}

export function paginate<T>(list: T[], per: PerPage, page: number) {
  const size = per === "all" ? Math.max(list.length, 1) : per;
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const from = (current - 1) * size;
  const items = list.slice(from, from + size);
  return {
    items,
    page: current,
    pages,
    start: items.length ? from + 1 : 0,
    end: items.length ? from + items.length : 0,
  };
}
