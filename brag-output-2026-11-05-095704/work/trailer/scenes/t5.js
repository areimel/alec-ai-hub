import { C, SYNC, W, H, scene, fonts, bigLines, pop, div, MONO } from "./_shared.js";
import { loadPage, setInput } from "/engine/lib.js";
import { typedCount } from "/__comp/timeline.js";
import { createTargetLock } from "/engine/fx.js";
const sc = scene("t5");
const SCALE = 1.72, TOP = 236, VH = Math.round((H - TOP) / SCALE);
let page, title, lock, rootEl, holderEl;

const CSS = `
header, .page-header, .skip-link, footer, #mobileMenuToggle{display:none!important}
.directory-filters__group + .directory-filters__group, #resetFilters, #emptyState, #resultCount{display:none!important}
main{padding:0!important;margin:0!important}
body{background:#141310!important}
.directory{display:block!important;padding-top:10px!important}
.directory__rail{width:auto!important;max-width:none!important;margin:0 0 20px!important}
.directory-filters__body{display:block!important}
.directory-filters__group > label{display:none!important}
#searchInput{height:60px!important;font-size:32px!important;padding:0 20px!important;border:3px solid #ff4d00!important;border-radius:0!important;background:#1c1b17!important;color:#efebe0!important}
#promptsGrid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;border-top:1px solid #3f3b31;border-left:1px solid #3f3b31}
.prompt-card__preview,.prompt-card__facts{display:none!important}
.prompt-card__title{font-size:26px!important}
.prompt-card__desc{font-size:15px!important}
`;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  const holder = div(root, { left: 0, top: TOP + "px", width: W + "px", height: H - TOP + "px", overflow: "hidden" });
  page = await loadPage(holder, "/prompts/", { width: Math.round(W / SCALE), height: VH, scale: SCALE, until: "#searchInput" });
    const st = page.doc.createElement("style"); st.textContent = CSS; page.doc.head.appendChild(st);
  title = bigLines(root, ["FIND IT."], { size: 250, x: 92, y: 18, lh: 0.86 });
  rootEl = root; holderEl = holder;
}

// Built lazily on first seek: scene roots are display:none during mount, so layout is only measurable once shown.
function ensureLock() {
  if (lock) return;
  const root = rootEl;
  setInput(page.doc, "#searchInput", SYNC.search.text);
  const card = page.doc.querySelector('.prompt-card[data-title="Board Update Template"]');
  const r = card.getBoundingClientRect();
  const to = { x: Math.round(r.left * SCALE), y: Math.round(r.top * SCALE + TOP), w: Math.round(r.width * SCALE), h: Math.round(r.height * SCALE) };
  setInput(page.doc, "#searchInput", "");
  const from = { x: to.x - 90, y: to.y - 70, w: to.w + 180, h: to.h + 140 };
  lock = createTargetLock(root, { start: SYNC.lock, from, to, label: "TARGET LOCKED" });
  const lbl = lock.el.querySelector(".lbl"); lbl.style.fontSize = "26px"; lbl.style.padding = "8px 14px 7px";
}

export function seek(f) {
  ensureLock();
  const n = typedCount(SYNC.search.text, SYNC.search.n0, f);
  setInput(page.doc, "#searchInput", SYNC.search.text.slice(0, n));
  pop(title.el, f, sc.start, { from: 1.15, frames: 4, origin: "0% 50%" });
  lock.seek(f);
  // Heavier corner brackets (64px arms, 6px stroke) for a bolder lock; fx draws 30px/3px.
  lock.el.querySelectorAll(".c").forEach((c) => {
    if (c.style.visibility === "hidden") return;
    const A = 64, a = parseFloat(c.style.width), right = parseFloat(c.style.borderRightWidth) > 0, bottom = parseFloat(c.style.borderBottomWidth) > 0;
    if (right) c.style.left = parseFloat(c.style.left) + a - A + "px";
    if (bottom) c.style.top = parseFloat(c.style.top) + a - A + "px";
    c.style.width = c.style.height = A + "px";
    for (const k of ["Top", "Bottom", "Left", "Right"]) if (parseFloat(c.style["border" + k + "Width"]) > 0) c.style["border" + k + "Width"] = "6px";
  });
}
