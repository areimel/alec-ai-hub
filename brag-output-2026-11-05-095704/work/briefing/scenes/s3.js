// s3 Find (f208-260): real /prompts directory, real search + filter, target lock on the real card.
import { SYNC, SCENES, typedCount, s16Frame } from "/__comp/timeline.js";
import { loadPage, setInput, createCaption, rampF } from "/engine/lib.js";
import { createHudFrame, createTargetLock, slam } from "/engine/fx.js";

const SC = SCENES.find((s) => s.id === "s3");
const SCALE = 1.5, VW = 1280, VH = 450;          // iframe css viewport; shown at 1920 x 720
const WIN_Y = 108, WIN_H = VH * SCALE;           // window position in composition
let S;
const TARGET = "Marketing Email Template Generator";

// Injected into the real page: reflow the directory to search + count + cards. No text is edited.
const CSS = `
header, .page-header, .skip-link, footer, #mobileMenuToggle{display:none!important}
.directory-filters__group + .directory-filters__group, #resetFilters, #emptyState{display:none!important}
main{padding:0!important;margin:0!important}
body{background:#141310!important}
.directory{display:block!important;padding-top:28px!important}
.directory__rail{width:auto!important;max-width:none!important;margin:0 0 16px!important}
.directory-filters__body{display:block!important}
#searchInput{height:60px!important;font-size:28px!important;padding:0 18px!important;border:2px solid #3f3b31!important;border-radius:0!important;background:#1c1b17!important;color:#efebe0!important}
.directory-filters__group > label{display:none!important}
#resultCount{font-size:22px!important;color:#ff4d00!important;margin:0 0 14px!important;letter-spacing:.08em!important}
#promptsGrid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;border-top:1px solid #3f3b31;border-left:1px solid #3f3b31}
.prompt-card__preview,.prompt-card__facts{display:none!important}
.prompt-card__title{font-size:26px!important}
.prompt-card__desc{font-size:15px!important}
`;

export async function mount(root) {
  const win = document.createElement("div");
  Object.assign(win.style, { position: "absolute", left: 0, top: WIN_Y + "px", width: "1920px", height: WIN_H + "px", overflow: "hidden" });
  root.appendChild(win);
  const pg = await loadPage(win, "/prompts/", { width: VW, height: VH, scale: SCALE, until: "#searchInput" });
  const { doc, frame } = pg;
  const st = doc.createElement("style"); st.textContent = CSS; doc.head.appendChild(st);
  await doc.fonts.ready;
  const input = doc.querySelector("#searchInput");
  for (const c of doc.querySelectorAll(".prompt-card")) if (/webasic/i.test(c.dataset.title || "")) c.setAttribute("data-bragHide", "1");
  const hs = doc.createElement("style"); hs.textContent = '.prompt-card[data-braghide]{display:none!important}'; doc.head.appendChild(hs);
  const grid = doc.querySelector("#promptsGrid");
  const cards = [...doc.querySelectorAll(".prompt-card")];
  const target = cards.find((c) => c.dataset.title === TARGET);
  if (!target) throw new Error("s3: target card not found");

  // Which typed counts leave a card with the excluded typo visible? (DOM-driven, not hard-coded.)
  const text = SYNC.search.text, n0 = SYNC.search.n0;
  const risky = [];
  for (let n = 0; n <= text.length; n++) {
    setInput(doc, "#searchInput", text.slice(0, n));
    risky[n] = cards.some((c) => false);
  }
  setInput(doc, "#searchInput", "");
  // First frame at which the grid is safe to show, and which stays safe.
  let reveal = SC.start;

  const rect = { x: 0, y: 0, w: 0, h: 0 };
  const hud = createHudFrame(root, { tl: "AI HUB / PROMPT RESEARCH BUREAU", tr: "DIRECTORY / PROMPTS", bl: "", br: "" });
  const lock = createTargetLock(root, {
    start: SYNC.lock,
    from: { x: 40, y: WIN_Y + 20, w: 1840, h: WIN_H - 40 },
    to: rect,
    label: "TARGET LOCKED",
  });
  const cap = createCaption(root, "MISSION 01", "Find it.");
  Object.assign(cap.style, { paddingTop: "40px", paddingBottom: "56px" });
  const line = cap.querySelector(".cap__line");
  Object.assign(line.style, { fontSize: "150px", lineHeight: "1" });
  cap.querySelector(".cap__kicker").style.fontSize = "40px";
  S = { measured: false, rect, win, doc, input, grid, cards, target, risky, reveal, topClip: 0, hud, lock, cap, text, n0 };
}

export function seek(f) {
  const { rect, win, doc, grid, cards, target, reveal, hud, lock, cap, text, n0 } = S;
  if (!S.measured) { measure(); S.measured = true; }
  const n = typedCount(text, n0, f);
  setInput(doc, "#searchInput", text.slice(0, n));
  const inp = doc.querySelector("#searchInput");
  inp.style.setProperty("border-color", f < s16Frame(n0 + text.length) + 8 ? "#ff4d00" : "#3f3b31", "important");
  // Grid is only ever visible when the typo card is filtered out.
  const isRisky = cards.some((c) => false);
  grid.style.visibility = "visible";
  // After the lock, the other cards drop back so the chosen one carries the frame.
  cards.forEach((c) => { c.style.opacity = f >= SYNC.lock && c !== target ? "0.3" : "1"; });
  hud.seek(f); lock.seek(f);
  slam(cap.querySelector(".cap__line"), f, SC.start, { from: 1.1, frames: 4 });
}

// Layout only exists while the scene is displayed, so the target rect is measured on first seek.
function measure() {
  const { rect, doc, cards, target, text } = S;
  setInput(doc, "#searchInput", text);
  const cr = target.getBoundingClientRect(), pad = 10;
  const shown = cards.filter((c) => c.style.display !== "none").length;
  if (shown !== 3) throw new Error("s3: expected 3 results, got " + shown);
  Object.assign(rect, { x: cr.left * SCALE - pad, y: WIN_Y + cr.top * SCALE - pad, w: cr.width * SCALE + 2 * pad, h: cr.height * SCALE + 2 * pad });
  S.topClip = (doc.querySelector("#resultCount").getBoundingClientRect().bottom + 6) * SCALE;
}
