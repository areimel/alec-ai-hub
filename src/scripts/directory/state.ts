// URL-backed state for the directory pages (search, filters, sort, page size, page, density).
export type SortMode = "newest" | "oldest" | "featured";
export type PerPage = 12 | 24 | 48 | "all";
export type ViewMode = "compact" | "normal" | "wide";

export interface DirectoryState {
  q: string;
  category: string;
  sub: string;
  tags: string[];
  sort: SortMode;
  per: PerPage;
  page: number;
  view: ViewMode;
}

export const DEFAULTS: DirectoryState = {
  q: "",
  category: "all",
  sub: "all",
  tags: [],
  sort: "newest",
  per: 24,
  page: 1,
  view: "normal",
};

const SORTS: SortMode[] = ["newest", "oldest", "featured"];
const VIEWS: ViewMode[] = ["compact", "normal", "wide"];

export function readState(params: URLSearchParams): DirectoryState {
  const sort = params.get("sort") as SortMode;
  const view = params.get("view") as ViewMode;
  const perRaw = params.get("per");
  const per: PerPage = perRaw === "all" ? "all" : [12, 24, 48].includes(Number(perRaw)) ? (Number(perRaw) as PerPage) : DEFAULTS.per;
  const page = Number.parseInt(params.get("page") ?? "", 10);
  return {
    q: params.get("q") ?? DEFAULTS.q,
    category: params.get("category") || DEFAULTS.category,
    sub: params.get("sub") || DEFAULTS.sub,
    tags: (params.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    sort: SORTS.includes(sort) ? sort : DEFAULTS.sort,
    per,
    page: Number.isFinite(page) && page >= 1 ? page : DEFAULTS.page,
    view: VIEWS.includes(view) ? view : DEFAULTS.view,
  };
}

export function writeState(state: DirectoryState): void {
  const p = new URLSearchParams();
  if (state.q !== DEFAULTS.q) p.set("q", state.q);
  if (state.category !== DEFAULTS.category) p.set("category", state.category);
  if (state.sub !== DEFAULTS.sub) p.set("sub", state.sub);
  if (state.tags.length) p.set("tags", state.tags.join(","));
  if (state.sort !== DEFAULTS.sort) p.set("sort", state.sort);
  if (state.per !== DEFAULTS.per) p.set("per", String(state.per));
  if (state.page !== DEFAULTS.page) p.set("page", String(state.page));
  if (state.view !== DEFAULTS.view) p.set("view", state.view);
  const qs = p.toString();
  const url = location.pathname + (qs ? `?${qs}` : "") + location.hash;
  history.replaceState(null, "", url);
}
