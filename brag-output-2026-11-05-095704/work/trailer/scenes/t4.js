import { C, SYNC, W, H, scene, fonts, div, widthAt100, DISPLAY, pop } from "./_shared.js";
const sc = scene("t4");
const rows = [];
const WORDS = ["PROMPTS", "CUSTOM AGENTS", "SKILLS & PLUGINS"];

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  const bandH = H / 3, MARGIN = 90, lh = 0.86;
  // one shared size: the longest label fills the width between the margins
  const size = Math.min(...[(W - 2 * MARGIN - 6) / Math.max(...WORDS.map((t) => widthAt100(t))) * 100]);
  WORDS.forEach((t, i) => {
    const band = div(root, { left: 0, top: i * bandH + "px", width: W + "px", height: bandH + "px", overflow: "hidden" });
    div(band, { left: 0, bottom: 0, width: W + "px", height: "3px", background: C.rule });
    const lab = div(band, { left: MARGIN + "px", top: Math.round((bandH - size * lh) / 2 + 6) + "px", font: `700 ${size}px/${lh} ${DISPLAY}`, letterSpacing: "-0.045em", color: C.ivory, whiteSpace: "nowrap" }, t);
    rows.push({ band, lab, land: SYNC.labels[i] });
  });
}

export function seek(f) {
  rows.forEach((r) => {
    const on = f - r.land >= 0, hit = on && f - r.land < 3;
    r.band.style.background = hit ? C.orange : C.charcoal;
    r.lab.style.color = hit ? C.charcoal : C.ivory;
    r.lab.style.opacity = on ? "1" : "0";
    pop(r.lab, f, r.land, { from: 1.2, frames: 4, origin: "0% 50%" });
  });
}
