// Scene D (15-17.5s): the three real plates from the home page, landing one per beat.
import { SYNC } from "/__comp/timeline.js";
import { loadPage, createCaption, clamp, lerp, ramp, easeOut, backOut } from "/__comp/lib.js";

const SC = 1.125;
const LINE = "Plus agents and skills for Claude Code.";
let S = null;

// Row layout, no overlap. Iframe px (960 wide, x1.125 = composition). Plate 310 comp wide, 18 gap, 56 gutters.
const PW = 310 / SC, PH = PW * 1.1 + 2;
const STEP = 328 / SC;
const SLOTS = [
  { x: 480 - STEP, y: 392 + 9, r: -1.5 },
  { x: 480,        y: 392 - 9, r: 1.5 },
  { x: 480 + STEP, y: 392 + 9, r: -1.5 },
];

export async function mount(root) {
  const page = await loadPage(root, "/", { width: 960, height: 960, scale: SC, until: ".plate-row .plate-link__frame svg" });
  const doc = page.doc;
  const main = doc.querySelector("main");
  const frames = [...doc.querySelectorAll(".plate-row .plate-link__frame")];
  const stage = doc.createElement("div");
  Object.assign(stage.style, { position: "fixed", inset: 0, zIndex: 999, background: "var(--background)", overflow: "hidden" });
  const grid = doc.createElement("div");
  Object.assign(grid.style, { position: "absolute", inset: 0, opacity: .35,
    backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "48px 48px" });
  stage.appendChild(grid);
  doc.body.appendChild(stage);
  // Move (not clone) the real frames so the SVG's internal pattern/clipPath ids keep resolving.
  frames.forEach((f) => {
    Object.assign(f.style, { position: "absolute", width: PW + "px", left: "0px", top: "0px", marginLeft: -PW / 2 + "px", marginTop: -PH / 2 + "px",
      boxShadow: "0 24px 48px rgba(0,0,0,.5)", transformOrigin: "50% 50%", opacity: 0 });
    stage.appendChild(f);
  });
  [...doc.body.children].forEach((c) => { if (c !== stage && c.tagName !== "SCRIPT" && c.tagName !== "STYLE") c.style.display = "none"; });
  const cap = createCaption(root, null, LINE);
  S = { frames, grid, cap };
}

export function seek(t) {
  const s = S; if (!s) return;
  s.grid.style.backgroundPosition = `${(-t * 10).toFixed(2)}px ${(t * 10).toFixed(2)}px`;
  s.frames.forEach((f, i) => {
    const beat = SYNC.plates[i];
    const k = clamp((t - beat) / 0.17);
    const p = backOut(k);
    const sl = SLOTS[i];
    const float = Math.sin(t * 1.6 + i * 2.1);
    const sc = lerp(0.55, 1, p);
    f.style.opacity = t < beat ? 0 : clamp(k * 6);
    f.style.zIndex = i;
    f.style.left = sl.x + "px"; f.style.top = (sl.y + (1 - p) * 40 + float * 4) + "px";
    f.style.transform = `rotate(${sl.r + (1 - p) * (i - 1) * 6 + float * 0.5}deg) scale(${sc})`;
  });
  const c = ramp(t, 14.9, 15.25);
  s.cap.style.opacity = c;
  s.cap.style.transform = `translateY(${(1 - c) * 24}px)`;
}
