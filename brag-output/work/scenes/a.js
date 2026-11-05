// Scene A (0-5s): hook (giant real Copy button) + reveal (real home hero).
import { SYNC } from "/__comp/timeline.js";
import { loadPage, createCursor, createCaption, setCopied, clamp, lerp, ramp, easeOut, easeInOut, backOut } from "/__comp/lib.js";

const BTN_W = 700;            // composition px
const SC = 1.125;             // iframe scale (960 -> 1080)
const LINE = "AI prompts, custom agents and skills.";
let S = null;

export async function mount(root) {
  const page = await loadPage(root, "/", { width: 960, height: 960, scale: SC, until: ".stat-strip dd" });
  const doc = page.doc;
  const $ = (s) => doc.querySelector(s);

  // Real copy button markup from the built prompts page.
  const html = await (await fetch("/prompts/")).text();
  const real = new DOMParser().parseFromString(html, "text/html").querySelector(".copy-button");
  const label = real.textContent.trim();
  const finals = [...doc.querySelectorAll(".stat-strip dd")].map((d) => parseInt(d.textContent, 10));

  // Declutter: only the hero stays.
  const main = $("main");
  [...doc.body.children].forEach((c) => { if (c !== main && c.tagName !== "SCRIPT" && c.tagName !== "STYLE") c.style.display = "none"; });
  [...main.children].forEach((c, i) => { if (i > 0) c.style.display = "none"; });
  $(".home-hero__intro").style.display = "none";
  $(".home-hero__actions").style.display = "none";
  const h1 = $(".home-hero h1");
  const muted = h1.querySelector(".home-hero__muted");
  const l1 = doc.createElement("span");
  l1.style.display = "block"; l1.textContent = "Working tools.";
  [...h1.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); });
  h1.insertBefore(l1, muted);
  h1.style.transformOrigin = '0 50%';
  doc.body.style.marginTop = "0";

  // Hook layer.
  const hook = doc.createElement("div");
  Object.assign(hook.style, { position: "fixed", inset: 0, zIndex: 999, overflow: "hidden", background: "transparent" });
  const grid = doc.createElement("div");
  Object.assign(grid.style, { position: "absolute", inset: 0, opacity: .5,
    backgroundImage: "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)", backgroundSize: "48px 48px" });
  hook.appendChild(grid);
  const marks = [[44, 44], [916, 44], [44, 916], [916, 916]].map(([x, y]) => {
    const m = doc.createElement("span"); m.className = "registration-mark";
    Object.assign(m.style, { position: "absolute", left: x - 10 + "px", top: y - 10 + "px", width: "20px", height: "20px", color: "var(--muted-foreground)", transformOrigin: "50% 50%" });
    hook.appendChild(m); return m;
  });
  const mkRule = (y) => { const r = doc.createElement("div");
    Object.assign(r.style, { position: "absolute", left: "44px", right: "44px", top: y + "px", height: "1px", background: "var(--muted-foreground)", opacity: .6, transformOrigin: "50% 50%" });
    hook.appendChild(r); return r; };
  const rules = [mkRule(220), mkRule(740)];
  const mkLab = (txt, x, y, right) => { const l = doc.createElement("div"); l.className = "technical-label"; l.textContent = txt;
    Object.assign(l.style, { position: "absolute", top: y + "px", [right ? "right" : "left"]: x + "px", fontSize: "13px", color: "var(--muted-foreground)" });
    hook.appendChild(l); return l; };
  const labs = [mkLab("AI Hub / Prompt research bureau", 44, 194), mkLab("Fig. 01", 44, 750), mkLab("Find / Fill in / Copy", 44, 750, true)];
  labs[2].style.right = "44px"; labs[2].style.left = "auto";
  const ring = doc.createElement("div");
  Object.assign(ring.style, { position: "absolute", left: "50%", top: "50%", border: "3px solid #ff4d00", transformOrigin: "50% 50%", opacity: 0 });
  hook.appendChild(ring);
  const ring2 = ring.cloneNode(false); hook.appendChild(ring2);
  const btn = real.cloneNode(false);
  btn.textContent = label;
  doc.body.appendChild(hook);
  hook.appendChild(btn);
  Object.assign(btn.style, { position: "absolute", left: "50%", top: "50%", margin: 0, transformOrigin: "50% 50%", cursor: "default" });
  const base = 0;

  const cursor = createCursor(root);
  const cap = createCaption(root, null, LINE);
  cap.style.paddingLeft = "45px"; // hero left edge (40 * 1.125)
  S = { doc, hook, grid, marks, rules, labs, ring, ring2, btn, base, label, finals,
    h1, kick: $(".home-hero__top"), l1, l2: muted, plate: $(".home-hero__plate"), strip: $(".stat-strip"), dds: [...doc.querySelectorAll(".stat-strip dd")], cursor, cap };
  S.dds.forEach((d) => { d.style.fontVariantNumeric = "tabular-nums"; });
}

const rise = (el, t, a, b, dy = 28) => { const k = ramp(t, a, b); el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * dy}px)`; };

export function seek(t) {
  const s = S; if (!s) return;
  if (!s.base) { // measure once the scene is displayed (layout is 0 while hidden at mount)
    const r = s.btn.getBoundingClientRect(); // untransformed on first call? transform set below, so measure with none
    s.btn.style.transform = "none"; s.btn.style.width = ""; s.btn.style.height = "";
    const m = s.btn.getBoundingClientRect(); const bw = Math.ceil(m.width), bh = Math.ceil(m.height);
    s.btn.style.width = bw + "px"; s.btn.style.height = bh + "px";
    [s.ring, s.ring2].forEach((r) => { r.style.width = bw + "px"; r.style.height = bh + "px"; });
    s.base = (BTN_W / SC) / bw;
  }
  // ---------- HOOK ----------
  const hookOn = t < 2.5;
  s.hook.style.display = hookOn ? "block" : "none";
  const fadeTex = 1 - ramp(t, 1.9, 2.2);
  s.grid.style.opacity = .5 * fadeTex;
  s.grid.style.backgroundPosition = `${(t * 14).toFixed(2)}px ${(t * 14).toFixed(2)}px`;
  s.marks.forEach((m, i) => { m.style.opacity = fadeTex; m.style.transform = `rotate(${(1 - ramp(t, 0, 0.7)) * -90 + t * 12}deg) scale(${1.6 + 0.2 * Math.sin(t * 3 + i)})`; });
  s.rules.forEach((r, i) => { r.style.opacity = .6 * fadeTex; r.style.transform = `scaleX(${0.15 + 0.85 * ramp(t, 0, 0.6)})`; });
  s.labs.forEach((l) => { l.style.opacity = fadeTex * ramp(t, 0.1, 0.5); });

  const enter = backOut(clamp(t / 0.55));
  const pressed = clamp((t - 0.93) / 0.06), release = ramp(t, 1.0, 1.3, backOut);
  const squash = 0.22 * clamp(pressed) * (1 - Math.min(release, 1.15));
  const idle = t > 0.55 ? 1 + 0.012 * Math.sin((t - 0.55) * 4) : 1;
  const exit = ramp(t, 2.0, 2.3, easeInOut);
  const scale = lerp(0.5, 1, enter) * idle * (1 - squash) * (1 - 0.92 * exit);
  const rot = lerp(-8, 0, enter) + 1.5 * Math.sin(t * 5) * (1 - ramp(t, 0.5, 1)) + 3 * exit;
  const dy = lerp(60, 0, enter) - 160 * exit;
  setCopied(s.btn, t >= SYNC.hookPress, s.label);
  s.btn.style.transform = `translate(-50%,-50%) translateY(${dy}px) rotate(${rot}deg) scale(${s.base * scale})`;
  s.btn.style.opacity = t < 0.15 ? 0.5 + t / 0.3 : 1 - ramp(t, 2.15, 2.3);
  const rk = ramp(t, SYNC.hookPress, SYNC.hookPress + 0.18);
  const ringOn = t >= SYNC.hookPress ? 1 - ramp(t, 2.0, 2.25) : 0;
  s.ring.style.opacity = ringOn;
  s.ring.style.transform = `translate(-50%,-50%) translateY(${dy}px) rotate(${rot}deg) scale(${s.base * (1 + 0.07 * rk) * idle * (1 - 0.92 * exit)})`;
  s.ring.style.borderWidth = 4 / s.base + "px";
  const pk2 = ramp(t, SYNC.hookPress, SYNC.hookPress + 0.5);
  s.ring2.style.opacity = t >= SYNC.hookPress ? 0.8 * (1 - pk2) : 0;
  s.ring2.style.transform = `translate(-50%,-50%) scale(${s.base * (1.07 + 0.35 * pk2)})`;
  s.ring2.style.borderWidth = 3 / s.base + "px";

  // cursor (composition coords); tip offset ~ (11,5)
  const tx = 720 - 11, ty = 590 - 5;
  const fly = ramp(t, 0, 0.95, easeOut);
  const away = ramp(t, 1.4, 2.1, easeInOut);
  const arc = Math.sin(fly * Math.PI) * -60;
  const cx = lerp(1130, tx, fly) + 90 * away, cy = lerp(1180, ty, fly) + arc + 160 * away;
  s.cursor.set(cx, cy, clamp((t - 0.93) / 0.07) * (1 - ramp(t, 1.18, 1.3)), 1 - ramp(t, 1.8, 2.1));

  // ---------- REVEAL ----------
  rise(s.kick, t, 2.2, 2.45, 14);
  rise(s.l1, t, 2.2, 2.5, 36);
  rise(s.l2, t, 2.25, 2.5, 36);
  const pk = backOut(clamp((t - 2.2) / 0.6));
  const drift = ramp(t, 2.6, 5, (k) => k);
  s.plate.style.opacity = clamp((t - 2.2) / 0.2);
  s.plate.style.transformOrigin = '100% 50%';
  s.plate.style.transform = `scale(${lerp(0.8, 1, pk) * (1 + 0.02 * drift)}) rotate(${lerp(-8, 0, pk) + 0.6 * drift}deg)`;
  rise(s.strip, t, 2.4, 2.65, 20);
  const ends = [3.0, 3.5, 4.0];
  s.dds.forEach((d, i) => {
    const k = ramp(t, ends[i] - 0.5, ends[i], easeOut);
    d.textContent = String(Math.round(s.finals[i] * k));
    const since = t - ends[i];
    d.style.color = since >= 0 && since < 0.3 ? "#ff4d00" : "";
  });
  const c = ramp(t, 2.6, 3.0);
  s.cap.style.opacity = c;
  s.cap.style.transform = `translateY(${(1 - c) * 30}px)`;
  s.h1.style.transform = 'scale(1.08)';
}
