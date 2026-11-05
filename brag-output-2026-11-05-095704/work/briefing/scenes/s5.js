// s5 Operatives (f364-468): the five real agent cards from /custom-agents/ land one per beat, real barcode + Access value.
import { SYNC, SCENES } from "/__comp/timeline.js";
import { loadPage, createCaption, rampF } from "/engine/lib.js";
import { createHudFrame, slam } from "/engine/fx.js";

const SC = SCENES.find((s) => s.id === "s5");
const STEP = 44;   // staggered dossier: each card sits one step lower
let S;

// Reflow of the real directory page into a stepped row. No card text is edited; only layout and emphasis.
const CSS = `
header, .page-header, .skip-link, footer, #mobileMenuToggle, .directory__rail, #resultCount, #emptyState{display:none!important}
body{background:#141310!important}
#promptsGrid{position:fixed!important;left:60px;top:136px;width:1800px;display:flex!important;gap:16px;align-items:flex-start;border:0!important}
.prompt-card{flex:1 1 0;min-width:0;position:relative;display:flex!important;flex-direction:column;gap:14px!important;padding:22px!important;
  background:#1c1b17!important;border:2px solid #3f3b31!important;transform-origin:50% 50%}
.prompt-card:nth-child(1){top:0}.prompt-card:nth-child(2){top:${STEP}px}.prompt-card:nth-child(3){top:${STEP * 2}px}
.prompt-card:nth-child(4){top:${STEP * 3}px}.prompt-card:nth-child(5){top:${STEP * 4}px}
.prompt-card__preview,.prompt-card__actions,.prompt-card__tags{display:none!important}
.prompt-card__meta{order:1;font-size:17px!important}
.prompt-card__barcode{width:150px!important;height:28px!important}
.prompt-card__title{order:2;font-size:38px!important;line-height:1.08!important;color:#efebe0!important;min-height:82px}
.prompt-card__facts{order:3;display:block!important}
.prompt-card__facts div:nth-child(n+2){display:none!important}
.prompt-card__facts div{display:block!important;background:#ff4d00;color:#141310;padding:10px 16px 12px}
.prompt-card__facts dt{font-size:16px!important;color:#141310!important;letter-spacing:.14em!important;margin:0 0 2px}
.prompt-card__facts dt::after{content:":"}
.prompt-card__facts dd{font:700 30px/1.15 ui-monospace,"Liberation Mono",monospace!important;color:#141310!important;text-transform:uppercase;margin:0;letter-spacing:.02em}
.prompt-card__desc{order:4;font-size:19px!important;line-height:1.45!important;color:#aaa596!important}
`;

export async function mount(root) {
  const pg = await loadPage(root, "/custom-agents/", { width: 1920, height: 1080, scale: 1, until: ".prompt-card" });
  const { doc } = pg;
  const st = doc.createElement("style"); st.textContent = CSS; doc.head.appendChild(st);
  await doc.fonts.ready;
  const cards = [...doc.querySelectorAll(".prompt-card")];
  if (cards.length !== 5) throw new Error("s5: expected 5 agent cards, found " + cards.length);
  if (SYNC.cards.length !== cards.length) throw new Error("s5: SYNC.cards does not match card count");
  // Facts for the assertions, straight from the DOM.
  const access = cards.map((c) => c.querySelector(".prompt-card__facts dd")?.textContent.trim());
  if (access.some((a) => !a)) throw new Error("s5: a card has no Access value");
  const hud = createHudFrame(root, { tl: "AI HUB / CUSTOM AGENTS", tr: "OPERATIVES 00 / 05", bl: "", br: "" });
  const cap = createCaption(root, "", "Then deploy the specialists. Five custom agents for Claude Code.");
  Object.assign(cap.style, { paddingTop: "70px", paddingBottom: "64px" });
  // Same verbatim sentence pair, broken at the sentence boundary.
  const line = cap.querySelector(".cap__line");
  line.textContent = "";
  for (const t of ["Then deploy the specialists.", "Five custom agents for Claude Code."]) { const d = document.createElement("div"); d.textContent = t; line.appendChild(d); }
  S = { cards, hud, cap, n: cards.length, slots: null };
}

// Empty dossier slots at the final card positions (measured once, while the scene is displayed and cards are untransformed).
function makeSlots(root) {
  S.slots = S.cards.map((c, i) => {
    const r = c.getBoundingClientRect();
    const d = document.createElement("div");
    Object.assign(d.style, { position: "absolute", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", boxSizing: "border-box",
      border: "2px dashed #3f3b31", zIndex: 3, color: "#aaa596", padding: "22px", font: "500 22px ui-monospace,'Liberation Mono',monospace", letterSpacing: ".14em" });
    d.textContent = "OPERATIVE " + String(i + 1).padStart(2, "0");
    root.appendChild(d);
    return d;
  });
}

export function seek(f) {
  if (!S.slots) makeSlots(S.cap.parentElement);
  const { cards, hud, cap, n, slots } = S;
  let landed = 0;
  cards.forEach((c, i) => {
    const t = SYNC.cards[i], k = f - t;
    slots[i].style.display = k < 0 ? "block" : "none";
    if (k < 0) { c.style.visibility = "hidden"; return; }
    landed++;
    c.style.visibility = "visible";
    const s = k < 4 ? 1.3 - 0.3 * rampF(f, t, t + 4) : 1;
    c.style.transform = `scale(${s})`;
    c.style.zIndex = k < 4 ? 5 : 1;
    // Orange outline slams in with the card, then settles to the rule colour.
    const hot = k < 7;
    c.style.setProperty("border-color", hot ? "#ff4d00" : "#3f3b31", "important");
    c.style.opacity = k < 2 ? "0.6" : "1";
  });
  hud.setLabels({ tr: `OPERATIVES ${String(landed).padStart(2, "0")} / ${String(n).padStart(2, "0")}` });
  hud.seek(f);
  slam(cap.querySelector(".cap__line"), f, SC.start, { from: 1.05, frames: 4 });
}
