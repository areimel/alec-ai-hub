import { C, SYNC, W, H, scene, fonts, div, fetchDoc, widthAt100, MONO, DISPLAY, pop } from "./_shared.js";
const sc = scene("t8");
const rows = [];
let endRule;
const ROW0 = 164, RH = 170;

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  // Real agent titles and Access labels from the built /custom-agents page.
  const doc = await fetchDoc("/custom-agents/");
  const all = [...doc.querySelectorAll(".prompt-card")].map((c) => ({
    name: c.dataset.title, title: c.querySelector(".prompt-card__title").textContent.trim().toUpperCase(),
    access: [...c.querySelectorAll(".prompt-card__facts > div")].find((d) => d.querySelector("dt").textContent.trim() === "Access").querySelector("dd").textContent.trim().toUpperCase(),
  }));
  const agents = SYNC.agents.map((n) => { const a = all.find((x) => x.name === n); if (!a) throw new Error("agent missing: " + n); return a; });
  const kick = div(root, { left: "96px", top: "90px", font: `500 44px/1 ${MONO}`, letterSpacing: "0.12em", color: C.orange, whiteSpace: "nowrap" }, "CUSTOM AGENTS FOR CLAUDE CODE");
  const NAMEW = 1920 - 96 - 96 - 470;
  const size = Math.min(130, (NAMEW / Math.max(...agents.map((a) => widthAt100(a.title, -0.045)))) * 100);
  agents.forEach((a, i) => {
    const row = div(root, { left: 0, top: ROW0 + i * RH + "px", width: W + "px", height: RH + "px" });
    div(row, { left: "96px", right: "96px", top: 0, height: "3px", background: C.rule });
    const name = div(row, { left: "96px", top: Math.round((RH - size * 0.86) / 2 + 4) + "px", whiteSpace: "nowrap", font: `700 ${size}px/0.86 ${DISPLAY}`, letterSpacing: "-0.045em", color: C.ivory }, a.title);
    const acc = div(row, { right: "96px", top: Math.round(RH / 2 - 42) + "px", textAlign: "right", whiteSpace: "nowrap" });
    div(acc, { position: "static", font: `500 32px/1 ${MONO}`, letterSpacing: "0.16em", color: C.muted, marginBottom: "10px" }, "ACCESS");
    const val = div(acc, { position: "static", font: `500 44px/1 ${MONO}`, letterSpacing: "0.06em", color: C.orange }, a.access);
    rows.push({ row, name, acc, val, land: SYNC.names[i] });
  });
  endRule = div(root, { left: "96px", right: "96px", top: ROW0 + agents.length * RH + "px", height: "3px", background: C.rule });
}

export function seek(f) {
  endRule.style.visibility = f >= rows[rows.length - 1].land ? "visible" : "hidden";
  rows.forEach((r) => {
    const k = f - r.land, on = k >= 0, hit = on && k < 3;
    r.row.style.visibility = on ? "visible" : "hidden";
    r.row.style.background = hit ? C.orange : "transparent";
    r.name.style.color = hit ? C.charcoal : C.ivory;
    r.val.style.color = hit ? C.charcoal : C.orange;
    r.acc.firstElementChild.style.color = hit ? C.charcoal : C.muted;
    pop(r.name, f, r.land, { from: 1.12, frames: 4, origin: "0% 50%" });
    pop(r.acc, f, r.land, { from: 1.12, frames: 4, origin: "100% 50%" });
  });
}
