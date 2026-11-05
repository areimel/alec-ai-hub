import { C, W, H, scene, fonts, bigLines, pop, loadPlate, div } from "./_shared.js";
const sc = scene("t3");
let plate, wm;

export async function mount(root) {
  await fonts();
  root.style.background = C.orange;
  // Full-bleed: plate 1920 css px wide (3.2x its 600 viewBox), radar disc framed in the middle.
  plate = await loadPlate(root, { w: W, h: H, plateW: W, offX: 0, offY: -330, start: sc.start });
  wm = bigLines(root, ["AI HUB."], { maxW: 1740, centerX: true, y: 0, lh: 0.8, color: C.charcoal, spacing: -0.035 });
  wm.el.style.top = Math.round((H - wm.h) / 2 + 40) + "px";
  const l = wm.lines[0]; l.textContent = "AI HUB";
  const d = document.createElement("span"); d.textContent = "."; d.style.color = C.ivory; l.appendChild(d);
}

export function seek(f) {
  plate.sweep.seek(f);
  pop(wm.el, f, sc.start + 1, { from: 1.4, frames: 4 });
}
