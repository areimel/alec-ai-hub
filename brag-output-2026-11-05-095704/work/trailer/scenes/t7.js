import { C, SYNC, W, H, scene, fonts, bigLines, pop, div } from "./_shared.js";
import { loadPage, setCopied, createCursor, lerp, rampF, easeInOut } from "/engine/lib.js";
const sc = scene("t7");
const SCALE = 12, BW = 116, BH = 32, VW = 136, VH = 46;
let page, btn, title, cursor, flash;

const CSS = `
body *{visibility:hidden!important}
#copyPrompt{visibility:visible!important;position:fixed!important;left:10px!important;top:7px!important;width:${BW}px!important;height:${BH}px!important;margin:0!important;z-index:99999!important;justify-content:center!important}
#copyPrompt[data-copied]{background:#efebe0!important;color:#141310!important;opacity:1!important;border-color:#efebe0!important}
html,body{background:#141310!important;margin:0!important}
`;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  title = bigLines(root, ["COPY IT."], { maxW: 1740, centerX: true, y: 10, lh: 0.86 });
  title.el.style.top = "34px";
  const fw = VW * SCALE, fh = VH * SCALE;
  const holder = div(root, { left: Math.round((W - fw) / 2) + "px", top: "560px", width: fw + "px", height: fh + "px", overflow: "hidden" });
  page = await loadPage(holder, "/prompts/board-update/", { width: VW, height: VH, scale: SCALE, until: "#copyPrompt" });
  const st = page.doc.createElement("style"); st.textContent = CSS; page.doc.head.appendChild(st);
  btn = page.doc.querySelector("#copyPrompt");
  cursor = createCursor(root);
  cursor.el.firstElementChild.setAttribute("width", "200"); cursor.el.firstElementChild.setAttribute("height", "200");
  flash = div(root, { left: 0, top: 0, width: W + "px", height: H + "px", background: C.ivory, opacity: 0, zIndex: 60 });
}

export function seek(f) {
  const k = f - SYNC.copyPress;
  setCopied(btn, k >= 0, "Copy prompt");
  pop(title.el, f, sc.start, { from: 1.12, frames: 4 });
  // cursor glides in from lower right and presses at copyPress; stays on the button after
  const t = rampF(f, sc.start + 6, SYNC.copyPress - 2, easeInOut);
  const tx = 1330, ty = 830;
  cursor.set(lerp(1760, tx, t), lerp(1010, ty, t), k >= 0 && k < 4 ? 1 : 0, f >= sc.start + 6 ? 1 : 0);
  flash.style.opacity = k === 0 ? "0.92" : k === 1 ? "0.5" : k === 2 ? "0.18" : "0";
}
