import { C, SYNC, W, H, scene, fonts, bigLines, pop, div, loadPlate, MONO, DISPLAY, widthAt100 } from "./_shared.js";
const sc = scene("t10");
let plate, holder, title, urlEl, by, rule;
const PS = 1.4, PW = 600, PH = 660;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  const pw = Math.round(PW * PS), ph = Math.round(PH * PS);
  holder = div(root, { left: W - 80 - pw + "px", top: Math.round((H - ph) / 2) + "px", width: pw + "px", height: ph + "px", overflow: "hidden" });
  plate = await loadPlate(holder, { w: PW, h: PH, scale: PS, plateW: PW, offX: 0, offY: 0, start: sc.start });
  const colW = W - 80 - pw - 96 - 40;
  title = bigLines(root, ["YOURS TO", "COPY."], { maxW: colW, x: 96, y: 0, lh: 0.86 });
  const urlSize = Math.min(104, (colW / widthAt100("ai-hub.alecreimel.com", -0.04)) * 100);
  const total = title.h + 70 + urlSize + 40 + 60;
  const y0 = Math.round((H - total) / 2);
  title.el.style.top = y0 + "px";
  rule = div(root, { left: "96px", top: y0 + title.h + 36 + "px", width: "140px", height: "10px", background: C.orange });
  urlEl = div(root, { left: "96px", top: y0 + title.h + 70 + "px", whiteSpace: "nowrap", font: `700 ${urlSize}px/1 ${DISPLAY}`, letterSpacing: "-0.04em", color: C.orange }, "ai-hub.alecreimel.com");
  by = div(root, { left: "98px", top: y0 + title.h + 70 + urlSize + 40 + "px", whiteSpace: "nowrap", font: `500 56px/1 ${DISPLAY}`, letterSpacing: "-0.01em", color: C.muted }, "By Alec Reimel");
}

export function seek(f) {
  plate.sweep.seek(f);
  pop(holder, f, sc.start, { from: 1.3, frames: 4 });
  pop(title.el, f, sc.start, { from: 1.15, frames: 4, origin: "0% 50%" });
  pop(rule, f, sc.start + 6, { from: 1.3, frames: 3, origin: "0% 50%" });
  pop(urlEl, f, sc.start + 6, { from: 1.1, frames: 4, origin: "0% 50%" });
  pop(by, f, sc.start + 14, { from: 1.1, frames: 4, origin: "0% 50%" });
}
