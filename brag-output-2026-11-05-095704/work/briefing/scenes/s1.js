// s1 Hook: charcoal, HUD frame, redacted line clears, ACCESS GRANTED stamp.
import { SYNC } from "/__comp/timeline.js";
import { createHudFrame, createRedactedText, createStamp, createTyper } from "/engine/fx.js";
import { clamp } from "/engine/lib.js";

let parts = [];
export async function mount(root) {
  root.style.background = "#141310";
  parts = [];
  const hud = createHudFrame(root, { labelTL: "AI HUB / PROMPT RESEARCH BUREAU", labelTR: "CLASSIFIED / EYES ONLY", labelBL: "FILE 0001 / CLEARANCE REVIEW", labelBR: "STATUS / OPEN" });
  parts.push(hud);

  const mono = { position: "absolute", fontFamily: 'ui-monospace,"Liberation Mono",monospace', textTransform: "uppercase", letterSpacing: ".24em", fontSize: "26px", color: "#ff4d00", whiteSpace: "nowrap" };
  const rule = document.createElement("div");
  Object.assign(rule.style, { position: "absolute", left: "160px", top: "262px", width: "1600px", height: "2px", background: "#3f3b31" });
  root.appendChild(rule);
  parts.push(createTyper(root, { text: "TO: DIRECTOR", n0: 0, x: 160, y: 208, style: { ...mono, font: "500 26px/1 ui-monospace,monospace" } }));

  const st = { fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: "140px", lineHeight: "1", letterSpacing: "-0.045em", color: "#efebe0" };
  parts.push(createRedactedText(root, { text: "Director.", x: 160, y: 310, style: st, start: 0, end: 14, seed: 11 }));
  parts.push(createRedactedText(root, { text: "Your clearance is approved.", x: 160, y: 468, style: st, start: 6, end: SYNC.hookLineFull, seed: 23 }));
  parts.push(createStamp(root, { text: "ACCESS GRANTED", x: 1320, y: 830, size: 96, rotate: -3, start: SYNC.stampAccess, seed: 5 }));
}
export function seek(f) { parts.forEach((p) => p.seek(f)); }
