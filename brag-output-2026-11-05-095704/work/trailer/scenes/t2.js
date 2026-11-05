import { C, W, H, scene, fonts, bigLines, pop, progressBar } from "./_shared.js";
const sc = scene("t2");
let block, bar;

export async function mount(root) {
  await fonts();
  root.style.background = C.orange;
  block = bigLines(root, ["FEW", "COMMAND", "IT."], { maxW: 1700, maxH: 940, centerX: true, y: 0, lh: 0.84, color: C.charcoal });
  block.el.style.top = Math.round((H - block.h) / 2 - 12) + "px";
  bar = progressBar(root, C.charcoal, sc);
}

export function seek(f) {
  pop(block.el, f, sc.start, { from: 1.12, frames: 4 });
  bar(f);
}
