import { C, SYNC, W, H, scene, fonts, div, fetchDoc, widthAt100, MONO, DISPLAY, pop } from "./_shared.js";
import { rampF } from "/engine/lib.js";
const sc = scene("t4");
const rows = [];

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  // Real counts from the built home page stat strip (Prompts / Custom agents / Skills & plugins).
  const doc = await fetchDoc("/");
  const stats = [...doc.querySelectorAll(".stat-strip > div")].map((d) => ({ label: d.querySelector("dt").textContent.trim().toUpperCase(), value: d.querySelector("dd").textContent.trim() }));
  const bandH = H / 3, NUM = 420, LAB = 182, lh = 0.86;
  // label column: wrap long labels onto two lines at the first space; fit all to one shared size
  const split = (t) => (t.split(" ").length > 1 && t.length > 8 ? t.replace(/ (?=[^ ]+$)/, "\n") : t);
  stats.forEach((s, i) => {
    const y = i * bandH;
    const band = div(root, { left: 0, top: y + "px", width: W + "px", height: bandH + "px", overflow: "hidden" });
    div(band, { left: 0, bottom: 0, width: W + "px", height: "3px", background: C.rule });
    const num = div(band, { right: W - 740 + "px", top: Math.round((bandH - NUM * lh) / 2 - NUM * 0.02) + "px", whiteSpace: "nowrap", font: `700 ${NUM}px/${lh} ${DISPLAY}`, letterSpacing: "-0.05em", color: C.orange }, s.value);
    const lines = split(s.label).split("\n");
    const lab = div(band, { left: "800px", top: Math.round((bandH - lines.length * LAB * lh) / 2 + 6) + "px", font: `700 ${LAB}px/${lh} ${DISPLAY}`, letterSpacing: "-0.045em", color: C.ivory, whiteSpace: "pre" }, lines.join("\n"));
    const tag = div(band, { left: "120px", top: "26px", font: `500 30px/1 ${MONO}`, letterSpacing: "0.14em", color: C.muted }, "0" + (i + 1) + " / 03");
    rows.push({ band, num, lab, tag, land: SYNC.numerals[i] });
  });
}

export function seek(f) {
  rows.forEach((r, i) => {
    const k = f - r.land;
    const on = k >= 0;
    const hit = on && k < 3;
    r.band.style.background = hit ? C.orange : C.charcoal;
    r.num.style.color = hit ? C.charcoal : C.orange;
    r.lab.style.color = hit ? C.charcoal : C.ivory;
    r.tag.style.color = hit ? C.charcoal : C.muted;
    r.num.style.opacity = r.lab.style.opacity = on ? "1" : "0";
    pop(r.num, f, r.land, { from: 1.35, frames: 4, origin: "100% 50%" });
    pop(r.lab, f, r.land + 1, { from: 1.2, frames: 4, origin: "0% 50%" });
  });
}
