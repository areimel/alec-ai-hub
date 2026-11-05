// Scene E (17.5-20s): outro end card.
import { SYNC } from "/__comp/timeline.js";
import { loadPage, clamp, lerp, ramp, easeOut, backOut } from "/__comp/lib.js";

const SC = 1.125;
const URL_TEXT = "ai-hub.alecreimel.com";
let S = null;

export async function mount(root) {
  const page = await loadPage(root, "/", { width: 960, height: 960, scale: SC, until: ".home-hero__plate svg" });
  const doc = page.doc;
  const plate = doc.querySelector(".home-hero__plate svg");
  const stage = doc.createElement("div");
  Object.assign(stage.style, { position: "fixed", inset: 0, zIndex: 999, background: "var(--background)", overflow: "hidden", textAlign: "center" });
  const grid = doc.createElement("div");
  Object.assign(grid.style, { position: "absolute", inset: 0, opacity: .35,
    backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "48px 48px" });
  stage.appendChild(grid);
  doc.body.appendChild(stage);
  // Move the real hero plate (keeps its internal ids resolving).
  const pw = 372;
  const plateBox = doc.createElement("div");
  Object.assign(plateBox.style, { position: "absolute", left: "50%", top: "78px", width: pw + "px", marginLeft: -pw / 2 + "px", transformOrigin: "50% 50%", boxShadow: "0 24px 48px rgba(0,0,0,.5)" });
  plateBox.appendChild(plate); stage.appendChild(plateBox);

  const mk = (css, text) => { const d = doc.createElement("div"); Object.assign(d.style, { position: "absolute", left: 0, right: 0, ...css }); d.textContent = text; stage.appendChild(d); return d; };
  const line = mk({ top: "540px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "40px", letterSpacing: "-0.02em", color: "var(--foreground)", lineHeight: 1.1 }, "Free to copy. No account.");
  const urlBox = doc.createElement("div");
  Object.assign(urlBox.style, { position: "absolute", left: "50px", right: "50px", top: "618px", background: "#ff4d00", color: "#141310", padding: "18px 0 20px", transformOrigin: "50% 50%" });
  const urlTxt = doc.createElement("div");
  urlTxt.textContent = URL_TEXT;
  Object.assign(urlTxt.style, { fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "-0.03em", whiteSpace: "nowrap", display: "inline-block", fontSize: "60px", lineHeight: 1.1 });
  urlBox.appendChild(urlTxt); stage.appendChild(urlBox);
  const by = mk({ top: "755px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".12em", fontSize: "24px", color: "var(--muted-foreground)" }, "By Alec Reimel");
  S = { doc, grid, plateBox, line, urlBox, urlTxt, by, fitted: false };
}

export function seek(t) {
  const s = S; if (!s) return;
  if (!s.fitted) { // fit URL to the box (layout is 0 while hidden at mount)
    const avail = 860 - 2; // iframe px inside 50px gutters minus padding
    let fs = 60; s.urlTxt.style.fontSize = fs + "px";
    const w = s.urlTxt.getBoundingClientRect().width;
    if (w) { fs = Math.floor(fs * Math.min(avail * 0.96, 880) / w); s.urlTxt.style.fontSize = fs + "px"; s.fitted = true; }
  }
  const T0 = SYNC.outro;
  s.grid.style.backgroundPosition = `${(-t * 8).toFixed(2)}px ${(t * 8).toFixed(2)}px`;
  const pk = ramp(t, T0, T0 + 0.25, backOut);
  const g = Math.sin((t - T0) * 1.3);
  s.plateBox.style.opacity = clamp((t - T0) / 0.08);
  s.plateBox.style.transform = `translateY(${(1 - pk) * 60 + g * 4}px) rotate(${lerp(-6, 0, pk) + g * 1.0}deg) scale(${lerp(0.8, 1, pk)})`;
  const l = ramp(t, T0 + 0.03, T0 + 0.15);
  s.line.style.opacity = l; s.line.style.transform = `translateY(${(1 - l) * 24}px)`;
  const u = ramp(t, T0 + 0.06, T0 + 0.167, backOut);
  s.urlBox.style.opacity = clamp((t - T0 - 0.1) / 0.06);
  s.urlBox.style.transform = `scale(${lerp(0.85, 1, u) * (1 + 0.006 * Math.sin((t - T0) * 2.2))})`;
  const b = ramp(t, T0 + 0.1, T0 + 0.167);
  s.by.style.opacity = b; s.by.style.transform = `translateY(${(1 - b) * 12}px)`;
}
