import { C, W, H, scene, fonts, bigLines, pop, progressBar, div } from "./_shared.js";
const sc = scene("t1");
let block, bar, dot;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  block = bigLines(root, ["EVERYONE", "HAS AI."], { maxW: 1660, centerX: true, y: 0, lh: 0.84 });
  block.el.style.top = Math.round((H - block.h) / 2 - 24) + "px";
  const l2 = block.lines[1];
  l2.textContent = "HAS AI";
  dot = document.createElement("span"); dot.textContent = "."; dot.style.color = C.orange; l2.appendChild(dot);
  bar = progressBar(root, C.orange, sc);
}

export function seek(f) {
  pop(block.el, f, sc.start, { from: 1.12, frames: 4 });
  bar(f);
}
