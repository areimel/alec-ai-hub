import { C, SYNC, W, H, scene, fonts, bigLines, pop, div } from "./_shared.js";
import { createStamp } from "/engine/fx.js";
const sc = scene("t9");
let free, stamp;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  free = bigLines(root, ["FREE."], { maxW: 1740, maxH: 520, centerX: true, y: 60, lh: 0.86 });
  free.el.style.top = "70px";
  stamp = createStamp(root, { text: "NO ACCOUNT.", x: 960, y: 826, size: 190, rotate: -4, start: SYNC.noAccount, color: "orange" });
}

export function seek(f) {
  pop(free.el, f, SYNC.free, { from: 1.15, frames: 4 });
  stamp.seek(f);
}
