import { SYNC, typedCount } from "/__comp/timeline.js";
import { loadPage, setInput, createCursor, createCaption, ramp, lerp, easeInOut, easeOut, clamp } from "/__comp/lib.js";

const T0 = 5.0, T1 = 9.0;
const SCALE = 1.5, CROP_H = 1080;
const S = { init: null, final: 0 };
let st;

export async function mount(root) {
  const crop = document.createElement("div");
  Object.assign(crop.style, { position: "absolute", left: 0, top: 0, width: "1080px", height: "1080px", overflow: "hidden" });
  root.appendChild(crop);
  const cam = document.createElement("div");
  Object.assign(cam.style, { position: "absolute", left: 0, top: 0, width: "1080px", height: CROP_H + "px", overflow: "hidden", transformOrigin: "540px 300px" });
  crop.appendChild(cam);
  const page = await loadPage(cam, "/prompts/", { width: 720, height: Math.ceil(CROP_H / SCALE) + 40, scale: SCALE });
  const { doc } = page;
  const css = doc.createElement("style");
  css.textContent = `#sidebarContent{display:block!important}
    .directory-filters__toggle{display:none!important}
    #sidebarContent > .directory-filters__group:not(:first-child){display:none!important}
    .prompt-card__preview{display:none!important}`;
  doc.head.appendChild(css);
  doc.getElementById("sidebarContent").classList.remove("hidden");

  const cards = [...doc.querySelectorAll("#promptsGrid > .prompt-card")];
  const target = cards.find((c) => /AI Prompt Template/.test(c.textContent) && !/Generator/.test(c.textContent));

  const cursor = createCursor(cam);
  const cap = createCaption(root, "Find", "Browse by category or search by keyword.");
  st = { m: null, crop, cam, page, doc, target, cursor, cap, input: doc.getElementById("searchInput") };
}

// Scenes mount hidden (display none), so layout is measured on first seek, then cached.
function ensureMeasured() {
  if (st.m) return;
  const { doc, target } = st;
  const word = SYNC.findTyping.text;
  setInput(doc, "#searchInput", word);
  doc.defaultView.scrollTo(0, 0);
  const tr = target.getBoundingClientRect();
  const search = st.input.getBoundingClientRect();
  st.m = { cardTop: tr.top, cardH: tr.height, cardL: tr.left, cardW: tr.width, searchTop: search.top, searchL: search.left, searchH: search.height };
  setInput(doc, "#searchInput", "");
  st.s0 = Math.max(0, st.m.searchTop - 100);
}

export function seek(t) {
  ensureMeasured();
  const { doc, page, m, cursor, cap, cam } = st;
  const word = SYNC.findTyping.text;
  const n = typedCount(word, SYNC.findTyping.start, t);
  setInput(doc, "#searchInput", word.slice(0, n));
  const typing = n > 0 && n < word.length || (n === word.length && t < SYNC.findTyping.start + 0.2 + word.length * 0.125);
  st.input.style.borderColor = typing || (n > 0 && t < SYNC.findPick - 0.5) ? "#ff4d00" : "";
  st.input.style.boxShadow = st.input.style.borderColor ? "0 0 0 3px rgba(255,77,0,.28)" : "";

  // Scroll: smooth, a pure function of t. Target card must be well inside the crop.
  const viewH = (CROP_H - 40) / SCALE;           // visible CSS px above caption
  const wantTop = 250;                            // card top, CSS px from viewport top
  const s1 = Math.max(st.s0, m.cardTop - wantTop);
  const scroll = lerp(st.s0, s1, ramp(t, 6.75, 7.75, easeInOut));
  page.scrollTo(scroll);

  // Camera push
  const push = 1 + 0.045 * ramp(t, T0, T1, (k) => k);
  cam.style.transform = `scale(${push})`;

  // Pressed card outline
  const pressed = ramp(t, SYNC.findPick - 0.05, SYNC.findPick + 0.1, (k) => k);
  const tg = st.target;
  tg.style.outline = pressed > 0.5 ? "2px solid rgba(255,77,0,.85)" : "";
  tg.style.outlineOffset = "2px";

  // Cursor path (composition px, inside cam)
  const cardX = (m.cardL + 400) * SCALE, cardY = (m.cardTop - scroll + 62) * SCALE;
  const sx = (m.searchL + 330) * SCALE, sy = (m.searchTop - st.s0 + m.searchH / 2) * SCALE;
  const a = ramp(t, 5.0, 5.55, easeOut);
  const b = ramp(t, 6.6, 7.7, easeInOut);
  const p0 = { x: lerp(1000, sx, a), y: lerp(780, sy, a) };
  // between search and card, the card center moves with scroll; use live card position at b
  const x = lerp(p0.x, cardX, b), y = lerp(p0.y, cardY, b);
  const press = ramp(t, SYNC.findPick, SYNC.findPick + 0.1, (k) => k) * (1 - ramp(t, SYNC.findPick + 0.3, SYNC.findPick + 0.45, (k) => k));
  cursor.set(x, y, press, ramp(t, 5.0, 5.15, (k) => k));

  // Caption
  const c = ramp(t, T0, 5.15, easeOut);
  for (const ch of cap.children) { ch.style.opacity = c; ch.style.transform = `translateY(${(1 - c) * 24}px)`; }
}
