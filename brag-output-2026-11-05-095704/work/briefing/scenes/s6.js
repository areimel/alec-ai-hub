// s6 Declassified: real plate row under redaction bars that tear off, huge DECLASSIFIED stamp, caption.
import { SYNC } from "/__comp/timeline.js";
import { createHudFrame, createRedaction, createStamp } from "/engine/fx.js";
import { loadPage } from "/engine/lib.js";

const PW = 540, GAP = 40, X0 = 110, TOP = 100, PH = Math.round(PW * 1.1);
const CSS = `
header,footer,.skip-link,astro-island,noscript,main>section:not(:nth-of-type(2)),.plate-link__caption{display:none!important}
html,body{background:#141310!important;overflow:hidden!important}
main>section:nth-of-type(2),main>section:nth-of-type(2)>div{padding:0!important;margin:0!important;max-width:none!important}
.plate-row{position:fixed!important;left:${X0}px;top:${TOP}px;width:${PW * 3 + GAP * 2}px;gap:${GAP}px!important;grid-template-columns:repeat(3,${PW}px)!important}
`;
let parts = [];
export async function mount(root) {
  root.style.background = "#141310";
  parts = [];
  const ctx = await loadPage(root, "/", { until: ".plate-row" });
  const st = ctx.doc.createElement("style"); st.textContent = CSS; ctx.doc.head.appendChild(st);
  parts.push(createHudFrame(root, { labelTL: "AI HUB / PROMPT RESEARCH BUREAU", labelTR: "CLEARANCE / REVOKED", labelBL: "FILE 0001 / RELEASE ORDER", labelBR: "STATUS / PUBLIC" }));
  const t0 = SYNC.declassified;
  [["right", 0], ["left", 2], ["right", 4]].forEach(([dir, d], i) => {
    parts.push(createRedaction(root, { x: X0 + i * (PW + GAP), y: TOP, w: PW, h: PH, start: t0 + 2 + d, end: t0 + 10 + d, dir, color: "ivory", seed: 40 + i }));
  });
  // slab behind the stamp so orange stays legible over any plate
  const slab = document.createElement("div");
  Object.assign(slab.style, { position: "absolute", left: "170px", top: "272px", width: "1580px", height: "296px", background: "#141310", transform: "rotate(-5deg)", visibility: "hidden" });
  root.appendChild(slab);
  parts.push({ seek(f) { slab.style.visibility = f >= t0 ? "visible" : "hidden"; } });
  parts.push(createStamp(root, { text: "DECLASSIFIED", x: 960, y: 420, size: 196, rotate: -5, start: t0, seed: 9 }));
  const cap = document.createElement("div");
  cap.textContent = "Free to copy. No account.";
  Object.assign(cap.style, { position: "absolute", left: "110px", top: "800px", fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: "120px", lineHeight: "1", letterSpacing: "-0.04em", color: "#efebe0", borderTop: "6px solid #ff4d00", paddingTop: "28px", width: "1700px" });
  root.appendChild(cap);
}
export function seek(f) { parts.forEach((p) => p.seek(f)); }
