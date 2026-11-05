// s2 Reveal: real home hero recomposed (plate huge right, real h1 + stat strip left), radar sweeping.
import { SYNC } from "/__comp/timeline.js";
import { createHudFrame, createRadarSweep } from "/engine/fx.js";
import { loadPage, clamp, easeOut } from "/engine/lib.js";

const S = { plate: 1.04, plateCx: 1385, plateCy: 540 };
const CSS = `
header,footer,.skip-link,.home-hero__top,.home-hero__intro,.home-hero__actions,main>section:not(.home-hero),astro-island,noscript{display:none!important}
html,body{background:#141310!important;overflow:hidden!important}
.home-hero,.home-hero>div,.home-hero__grid{padding:0!important;margin:0!important;display:block!important;max-width:none!important;min-height:0!important;border:0!important}
.home-hero__plate{position:fixed!important;left:${S.plateCx - 400.5}px;top:${S.plateCy - 440.5}px;width:801px;height:881px;margin:0!important;transform-origin:50% 50%}
.home-hero__copy{position:fixed!important;left:100px;top:150px;width:700px;margin:0!important;padding:0!important;transform-origin:0 0;transform:scale(1.2)}
.stat-strip{position:fixed!important;left:100px;top:490px;width:800px;margin:0!important;border-top:2px solid #3f3b31;border-bottom:2px solid #3f3b31}
.stat-strip dd{font-size:96px!important;line-height:1!important}
`;
let ctx, hud, sweep, plate, copy, strip, dds = [], finals = [], cap, bar;

export async function mount(root) {
  root.style.background = "#141310";
  ctx = await loadPage(root, "/", { until: ".stat-strip" });
  const d = ctx.doc;
  const st = d.createElement("style"); st.textContent = CSS; d.head.appendChild(st);
  plate = d.querySelector(".home-hero__plate");
  copy = d.querySelector(".home-hero__copy");
  strip = d.querySelector(".stat-strip");
  dds = [...strip.querySelectorAll("dd")];
  finals = dds.map((e) => e.textContent.trim());
  const svg = plate.querySelector("svg");
  sweep = createRadarSweep(svg, { wedge: 'path[d^="M245 277L144"]', needle: 'path[d^="M245 277L379"]', start: SYNC.plateLand, period: 104 });

  hud = createHudFrame(root, { labelTL: "AI HUB / PROMPT RESEARCH BUREAU", labelTR: "FIG. 01 / RADAR TELEMETRY", labelBL: "ACCESS / UNRESTRICTED", labelBR: "SCAN 360 / ACTIVE" });
  hud.el.style.zIndex = 5;
  cap = document.createElement("div");
  cap.textContent = "AI prompts, custom agents and skills.";
  Object.assign(cap.style, { position: "absolute", left: "100px", top: "760px", width: "820px", fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: "68px", lineHeight: "1.04", letterSpacing: "-0.035em", color: "#efebe0", borderTop: "6px solid #ff4d00", paddingTop: "26px" });
  root.appendChild(cap);
}

export function seek(f) {
  const t = f - SYNC.plateLand;
  // plate slam: huge to settled with a small overshoot, offset flies in from the right
  const k = clamp(t / 6), s = t < 0 ? 1 : 1 + 0.55 * Math.pow(1 - k, 3) - (t >= 6 && t < 10 ? 0.02 * Math.sin(((t - 6) / 4) * Math.PI) : 0);
  plate.style.opacity = t < 0 ? 0 : 1;
  plate.style.transform = `translate(${(1 - easeOut(k)) * 140}px,0) scale(${(S.plate * s).toFixed(4)})`;
  sweep.seek(f);
  // headline: stepped wipe left to right
  const hk = clamp((f - (SYNC.plateLand + 5)) / 8);
  copy.style.clipPath = `inset(-10px ${(100 - Math.round(hk * 6) / 6 * 100).toFixed(1)}% -10px 0)`;
  copy.style.opacity = f < SYNC.plateLand + 5 ? 0 : 1;
  // stat strip counts to its real values
  strip.style.opacity = t < 0 ? 0 : 1;
  dds.forEach((dd, i) => {
    const n = Number(finals[i]), land = SYNC.statLands[i];
    const p = clamp((f - SYNC.plateLand) / (land - SYNC.plateLand));
    dd.textContent = f >= land ? finals[i] : String(Math.round(n * easeOut(p)));
  });
  // caption from f110
  const ck = clamp((f - 110) / 6);
  cap.style.clipPath = `inset(-20px ${(100 - Math.round(ck * 6) / 6 * 100).toFixed(1)}% -20px 0)`;
  cap.style.opacity = f < 110 ? 0 : 1;
  hud.seek(f);
}
