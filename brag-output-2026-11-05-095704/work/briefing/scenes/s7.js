// s7 Outro: real AI HUB plate sweeping, URL, tagline, byline; HUD lines cut out on beats to a clean end card.
import { SYNC } from "/__comp/timeline.js";
import { createHudFrame, createRadarSweep } from "/engine/fx.js";
import { loadPage, clamp, easeOut } from "/engine/lib.js";

const P = { s: 0.75, cx: 1500, cy: 430 };   // plate centre and scale
const T0 = 520, CUT = [598, 604, 611];       // HUD cut-outs (beats / half-beat)
const CSS = `
header,footer,.skip-link,.home-hero__top,.home-hero__copy,.stat-strip,.home-hero__intro,.home-hero__actions,main>section:not(.home-hero),astro-island,noscript{display:none!important}
html,body{background:#141310!important;overflow:hidden!important}
.home-hero,.home-hero>div,.home-hero__grid{padding:0!important;margin:0!important;display:block!important;max-width:none!important;min-height:0!important;border:0!important}
.home-hero__plate{position:fixed!important;left:${P.cx - 400.5}px;top:${P.cy - 440.5}px;width:801px;height:881px;margin:0!important;transform-origin:50% 50%}
`;
const MONO = 'ui-monospace,"Liberation Mono",monospace';
let plate, sweep, hud, rows = [], url, tag, by, rule;
const mk = (css, text) => { const e = document.createElement("div"); Object.assign(e.style, { position: "absolute", whiteSpace: "nowrap" }, css); if (text) e.innerHTML = text; return e; };

export async function mount(root) {
  root.style.background = "#141310";
  const ctx = await loadPage(root, "/", { until: ".home-hero__plate" });
  const st = ctx.doc.createElement("style"); st.textContent = CSS; ctx.doc.head.appendChild(st);
  plate = ctx.doc.querySelector(".home-hero__plate");
  sweep = createRadarSweep(plate.querySelector("svg"), { wedge: 'path[d^="M245 277L144"]', needle: 'path[d^="M245 277L379"]', start: T0, period: 104 });
  hud = createHudFrame(root, { labelTL: "AI HUB / PROMPT RESEARCH BUREAU", labelTR: "CLEARANCE / APPROVED", labelBL: "FILE 0001 / RELEASE ORDER", labelBR: "STATUS / PUBLIC" });
  hud.el.style.zIndex = 5;

  const label = { fontFamily: MONO, fontSize: "26px", letterSpacing: ".24em", textTransform: "uppercase", color: "#ff4d00" };
  tag = mk({ ...label, left: "110px", top: "150px" }, "Release order / public");
  rule = mk({ left: "110px", top: "206px", width: "700px", height: "3px", background: "#ff4d00" });
  const sub = mk({ left: "110px", top: "250px", fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: "96px", lineHeight: "1.0", letterSpacing: "-0.04em", color: "#efebe0", whiteSpace: "normal", width: "760px" }, "Free to copy.<br>No account.");
  by = mk({ ...label, color: "#aaa596", left: "110px", top: "510px", fontSize: "48px", letterSpacing: ".16em", color: "#efebe0" }, "By Alec Reimel");
  url = mk({ left: "110px", top: "790px", fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: "168px", lineHeight: "1", letterSpacing: "-0.05em", color: "#efebe0" }, "ai-hub.alecreimel.com");
  const rule2 = mk({ left: "110px", top: "764px", width: "1700px", height: "2px", background: "#3f3b31" });
  [tag, rule, sub, by, rule2, url].forEach((e) => root.appendChild(e));
  // extra HUD readouts that cut out one at a time
  const r1 = mk({ ...label, color: "#aaa596", fontSize: "22px", left: "110px", top: "600px", lineHeight: "1.9" });
  r1.innerHTML = "SIGNAL / OPEN<br>PROMPTS / AGENTS / SKILLS";
  const r2 = mk({ ...label, color: "#aaa596", fontSize: "22px", left: "110px", top: "690px" }, "SCAN 360 / ACTIVE");
  root.appendChild(r1); root.appendChild(r2);
  rows = [{ at: CUT[0], els: [r1, r2], tag: true }, { at: CUT[1], hudLabels: true }, { at: CUT[2], brackets: true }];
}

export function seek(f) {
  const t = f - T0, k = clamp(t / 6);
  const s = 1 + 0.5 * Math.pow(1 - k, 3);
  plate.style.opacity = t < 0 ? 0 : 1;
  plate.style.transform = `translate(${(1 - easeOut(k)) * 120}px,0) scale(${(P.s * s).toFixed(4)})`;
  sweep.seek(f);
  // text lands with the plate
  const wipe = (e, from, n = 8) => { const p = clamp((f - from) / n); e.style.clipPath = `inset(-20px ${(100 - Math.round(p * 6) / 6 * 100).toFixed(1)}% -20px 0)`; e.style.visibility = f < from ? "hidden" : "visible"; };
  wipe(url, T0 + 2, 10);
  wipe(tag, T0 + 8); wipe(rule, T0 + 8); wipe(by, T0 + 12);
  const sub = rule.nextSibling;
  wipe(sub, T0 + 6, 10);
  // HUD cut-outs
  rows[0].els.forEach((e) => (e.style.display = f >= CUT[0] ? "none" : ""));
  tag.style.display = f >= CUT[0] ? "none" : "";
  rule.style.display = f >= CUT[0] ? "none" : "";
  hud.setLabels(f >= CUT[1] ? { tl: "", tr: "", bl: "", br: "" } : { tl: "AI HUB / PROMPT RESEARCH BUREAU", tr: "CLEARANCE / APPROVED", bl: "FILE 0001 / RELEASE ORDER", br: "STATUS / PUBLIC" });
  hud.el.style.display = f >= CUT[2] ? "none" : "";
  hud.seek(f);
}
