/* fx.js - spy-agency FX library. Pure functions of an integer frame. No timers/Math.random/Date/CSS animation.
 * Requires fx.css. Every factory: (parent, opts) -> { el, seek(f), ... }. Coordinates are 1920x1080 px.
 * Colours may be a palette key (charcoal|ivory|orange|rule|muted) or any CSS colour.
 *
 *  createOverlay(stage, {cuts:[frames], cutId:"briefing"|"trailer"})
 *     Top layer (z 9000): vignette, 3px scanlines, seeded grain tile offset per frame, glitch cut-hit.
 *     Glitch runs on frames c..c+1 (briefing) / c..c+2 (trailer) for each c in cuts (c<=0 ignored: frame 0 stays clean).
 *     Slices are difference-blend ivory bars (invert what is beneath) + orange/ivory slivers. Trailer: full ivory flash at c.
 *     NOTE: it paints over the scene, it cannot shift scene pixels sideways.
 *  createHudFrame(parent, {labelTL,labelTR,labelBL,labelBR, timecode:false}) -> {el, seek, setLabels({tl,tr,bl,br})}
 *     48px margin brackets, mid-edge registration crosses, mono labels. timecode:true shows "TC mm:ss:ff  F###" bottom centre.
 *  createRedaction(parent, {x,y,w,h, start, end, dir:"right"|"left"|"up"|"down", on:false, color:"ivory", seed})
 *     Solid bar, wipes OFF between start and end (on:true wipes ON). Stepped edge jitter, deterministic. Covered before start (off).
 *  createRedactedText(parent, {text, style:{css}, start, end, color:"ivory", x, y, seed}) -> {el, seek}
 *     Text line, each word under its own bar; bars tear away word by word (rightwards) from start, all gone by end.
 *     Pass x,y to place absolutely, else it flows in parent. style default: DM Sans 700 64px ivory.
 *  createStamp(parent, {text, x, y, size=96, rotate=-6, start, color:"orange", seed})
 *     x,y is the CENTRE. Hidden before start. Scale 1.5/1.12/0.96/1.02 on start..start+3, settled (1.0) from start+4.
 *     Double rule border, seeded distressed-ink mask.
 *  createRadarSweep(svgRoot, {wedge, needle, cx=245, cy=277, start=0, period=104})
 *     wedge/needle: element or selector (within svgRoot). Sets transform="rotate(a cx cy)" (overwrites existing transform).
 *     One revolution per `period` frames, angle 0 until start.
 *  createTargetLock(parent, {start, from:{x,y,w,h}, to:{x,y,w,h}, label:"TARGET LOCKED"})
 *     Orange corner brackets converge over 10 frames with slight overshoot, then hold; hairline crosshair + label tab.
 *  createTyper(parent, {text, n0=0, style:{css}, caret:true, x, y}) -> {el, seek, count(f)}
 *     1 char per 16th from 16th index n0 (typedCount). Untyped remainder is invisible but reserves layout. Caret blinks by frame.
 *  slam(el, f, start, {from=1.25, frames=4, base=""})
 *     opacity 0 before start; scale from->1 ease-out over `frames`, no blur. base = extra transform prefix (e.g. translate).
 *  Exports: hash(a,b,c)->uint32, rnd(a,b,c)->[0,1), clamp.
 */
import { typedCount } from "/engine/grid.js";

const PAL = { charcoal: "#141310", ivory: "#efebe0", orange: "#ff4d00", rule: "#3f3b31", muted: "#aaa596" };
const col = (c, d = "ivory") => PAL[c] || c || PAL[d];
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export function hash(a, b = 0, c = 0) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177) + 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16;
  return h >>> 0;
}
export const rnd = (a, b, c) => hash(a, b, c) / 4294967296;
const mk = (tag, cls, parent, css) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  if (parent) parent.appendChild(e);
  return e;
};
const px = (v) => (typeof v === "number" ? v + "px" : v);
const seedOf = (s) => (typeof s === "number" ? s : [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 7));

// ---------------------------------------------------------------- overlay
function noiseTile(size = 256) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d"), img = g.createImageData(size, size), d = img.data;
  for (let i = 0; i < size * size; i++) {
    const r = rnd(1337, i, 1), light = rnd(1337, i, 2) < 0.62;
    const v = light ? 239 : 0;
    d[i * 4] = v; d[i * 4 + 1] = light ? 235 : 0; d[i * 4 + 2] = light ? 224 : 0;
    d[i * 4 + 3] = Math.floor(r * r * 255);
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}
export function createOverlay(stage, { cuts = [], cutId = "briefing" } = {}) {
  const el = mk("div", "fx-overlay", stage);
  mk("div", "fx-vig", el);
  const grain = mk("div", "fx-grain", el); grain.style.backgroundImage = `url(${noiseTile()})`; grain.style.backgroundSize = "256px 256px";
  mk("div", "fx-scan", el);
  const gl = mk("div", "fx-glitch", el);
  const trailer = cutId === "trailer", hits = trailer ? 3 : 2;
  const list = cuts.filter((c) => c > 0);
  function glitch(f) {
    gl.textContent = "";
    for (let ci = 0; ci < list.length; ci++) {
      const k = f - list[ci];
      if (k < 0 || k >= hits) continue;
      const s = hash(list[ci], k, 99), R = (n, m = 0) => rnd(s, n, m);
      if (trailer && k === 0) { mk("i", "", gl, { inset: 0, background: PAL.ivory, opacity: 0.94 }); }
      const nb = trailer ? 7 + (s % 6) : 4 + (s % 4);
      for (let i = 0; i < nb; i++) {
        const h = (trailer ? 8 : 4) + Math.floor(R(i, 1) * (trailer ? 150 : 44));
        const y = Math.floor(R(i, 2) * (1080 - h)), x = Math.floor(R(i, 3) * 900), w = 500 + Math.floor(R(i, 4) * 1420 );
        if (R(i, 5) < 0.7) mk("i", "fx-diff", gl, { left: x + "px", top: y + "px", width: Math.min(w, 1920 - x) + "px", height: h + "px" });
        else mk("i", "", gl, { left: x + "px", top: y + "px", width: Math.min(w, 1920 - x) + "px", height: (2 + Math.floor(R(i, 6) * 6)) + "px", background: R(i, 7) < 0.6 ? PAL.orange : PAL.ivory });
      }
      // orange flash sliver, full width, thin
      mk("i", "", gl, { left: 0, width: "1920px", top: Math.floor(R(40) * 1070) + "px", height: (trailer ? 14 : 6) + "px", background: PAL.orange });
      if (trailer && k === 1) mk("i", "", gl, { inset: 0, background: PAL.orange, opacity: 0.22 });
    }
  }
  return {
    el,
    seek(f) {
      const h = hash(f, 7, 3);
      grain.style.backgroundPosition = `${h % 256}px ${(h >>> 8) % 256}px`;
      glitch(f);
    },
  };
}

// ---------------------------------------------------------------- HUD frame
const tcText = (f) => `TC ${String(Math.floor(f / 30)).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}  F${String(f).padStart(3, "0")}`;
export function createHudFrame(parent, o = {}) {
  const el = mk("div", "fx-hud", parent);
  ["tl", "tr", "bl", "brr"].forEach((c) => mk("i", "br " + c, el));
  [[960, 48], [960, 1032], [48, 540], [1872, 540]].forEach(([x, y]) => { const c = mk("i", "cx", el, { left: x + "px", top: y + "px" }); mk("i", "", c); });
  const lb = { tl: mk("div", "lb tl", el), tr: mk("div", "lb tr", el), bl: mk("div", "lb bl", el), br: mk("div", "lb rb", el) };
  const tc = o.timecode ? mk("div", "tc", el) : null;
  const api = {
    el,
    setLabels(l = {}) {
      const m = { tl: l.tl ?? l.labelTL, tr: l.tr ?? l.labelTR, bl: l.bl ?? l.labelBL, br: l.br ?? l.labelBR };
      for (const k in m) if (m[k] !== undefined) lb[k].textContent = m[k];
    },
    seek(f) { if (tc) tc.textContent = tcText(f); },
  };
  api.setLabels(o);
  if (tc) tc.textContent = tcText(0);
  return api;
}

// ---------------------------------------------------------------- redaction
// clip-path polygon (percent) for a bar whose moving edge is at progress p. null = nothing visible.
function barPoly(p, dir, on, seed, f, L, A, jpx) {
  if (on ? p <= 0 : p >= 1) return null;
  const full = on ? p >= 1 : p <= 0;
  const N = full ? 1 : clamp(Math.round(A / 10), 4, 24), pts = [];
  const env = Math.sin(Math.PI * clamp(p));
  for (let k = 0; k < N; k++) {
    let e = full ? (on ? 1 : 0) : p + ((rnd(seed, k, f) - 0.5) * 2 * jpx * env) / L;
    e = clamp(e);
    pts.push([e, k / N], [e, (k + 1) / N]);
  }
  pts.push(on ? [0, 1] : [1, 1], on ? [0, 0] : [1, 0]);
  if (full) return "inset(0)";
  const map = ([u, v]) => {
    const [x, y] = dir === "right" ? [u, v] : dir === "left" ? [1 - u, v] : dir === "down" ? [v, u] : [v, 1 - u];
    return `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`;
  };
  return `polygon(${pts.map(map).join(",")})`;
}
const applyBar = (b, clip) => { b.style.visibility = clip ? "visible" : "hidden"; b.style.clipPath = clip || ""; };

export function createRedaction(parent, o) {
  const { x, y, w, h, start = 0, end = start + 8, dir = "right", on = false } = o, seed = o.seed ?? hash(x | 0, y | 0, 5);
  const el = mk("div", "fx-red", parent, { left: px(x), top: px(y), width: px(w), height: px(h) });
  const b = mk("b", "", el, { background: col(o.color) });
  const horiz = dir === "left" || dir === "right";
  return { el, seek(f) { applyBar(b, barPoly(clamp((f - start) / (end - start)), dir, on, seed, f, horiz ? w : h, horiz ? h : w, 14)); } };
}

export function createRedactedText(parent, o) {
  const { text, start = 0, end = start + 30 } = o, seed = o.seed ?? seedOf(text);
  const el = mk("div", "fx-rtext", parent);
  if (o.x !== undefined) Object.assign(el.style, { position: "absolute", left: px(o.x), top: px(o.y), whiteSpace: "nowrap" });
  if (o.style) Object.assign(el.style, o.style);
  const words = text.split(/\s+/), n = words.length, bars = [];
  words.forEach((wd, i) => {
    const s = mk("span", "fx-rw", el); s.append(wd);
    bars.push(mk("b", "", s, { background: col(o.color) }));
    if (i < n - 1) el.append(" ");
  });
  const d = Math.max(4, Math.min(8, end - start)), step = n > 1 ? (end - start - d) / (n - 1) : 0;
  return {
    el,
    seek(f) {
      bars.forEach((b, i) => {
        const ws = start + Math.round(i * step);
        applyBar(b, barPoly(clamp((f - ws) / d), "right", false, seed + i, f, 120, 60, 10));
      });
    },
  };
}

// ---------------------------------------------------------------- stamp
function inkMask(seed) {
  const W = 512, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 520; i++) {                       // fine dropout speckle
    const r = rnd(seed, i, 1), x = rnd(seed, i, 2) * W, y = rnd(seed, i, 3) * H, s = 0.6 + r * r * 3.2;
    g.globalAlpha = 0.55 + rnd(seed, i, 4) * 0.45; g.fillRect(x, y, s, s * (0.6 + rnd(seed, i, 5)));
  }
  for (let i = 0; i < 9; i++) {                         // worn patches
    const x = rnd(seed, i, 6) * W, y = rnd(seed, i, 7) * H, r = 6 + rnd(seed, i, 8) * 18;
    for (let j = 0; j < 22; j++) { g.globalAlpha = 0.5 + rnd(seed, i, 20 + j) * 0.5; g.fillRect(x + (rnd(seed, i, 40 + j) - 0.5) * r * 2, y + (rnd(seed, i, 60 + j) - 0.5) * r, 1 + rnd(seed, i, 80 + j) * 4, 1 + rnd(seed, i, 100 + j) * 2); }
  }
  g.globalAlpha = 0.9; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) {                         // hairline scratches
    g.beginPath(); const x = rnd(seed, i, 200) * W, y = rnd(seed, i, 201) * H;
    g.moveTo(x, y); g.lineTo(x + (rnd(seed, i, 202) - 0.5) * 180, y + (rnd(seed, i, 203) - 0.5) * 30); g.stroke();
  }
  return `url(${c.toDataURL("image/png")})`;
}
const STAMP_SCALE = [1.5, 1.12, 0.96, 1.02];
export function createStamp(parent, o) {
  const { text, x = 960, y = 540, size = 96, rotate = -6, start = 0 } = o, seed = o.seed ?? seedOf(text);
  const el = mk("div", "fx-stamp", parent, { color: col(o.color, "orange"), fontSize: size + "px" });
  const outer = mk("div", "o tex", el), inner = mk("div", "i", outer); inner.textContent = text;
  const m = inkMask(seed); outer.style.webkitMaskImage = outer.style.maskImage = m;
  return {
    el,
    seek(f) {
      const k = f - start;
      if (k < 0) { el.style.visibility = "hidden"; return; }
      el.style.visibility = "visible";
      const s = k < 4 ? STAMP_SCALE[k] : 1;
      el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rotate}deg) scale(${s})`;
    },
  };
}

// ---------------------------------------------------------------- radar
export function createRadarSweep(svgRoot, { wedge, needle, cx = 245, cy = 277, start = 0, period = 104 } = {}) {
  const get = (t) => (typeof t === "string" ? svgRoot.querySelector(t) : t);
  const els = [wedge, needle].map(get).filter(Boolean);
  return {
    els,
    seek(f) {
      const a = f < start ? 0 : (((f - start) % period) / period) * 360;
      const v = `rotate(${a.toFixed(3)} ${cx} ${cy})`;
      els.forEach((e) => e.setAttribute("transform", v));
    },
  };
}

// ---------------------------------------------------------------- target lock
export function createTargetLock(parent, { start = 0, from, to, label = "TARGET LOCKED", dur = 10 } = {}) {
  const el = mk("div", "fx-lock", parent);
  const cs = [0, 1, 2, 3].map(() => mk("i", "c", el));
  const hl = [0, 1, 2, 3].map(() => mk("i", "h", el));            // outward hairlines at edge midpoints
  const tick = [0, 1, 2, 3].map(() => mk("i", "h", el));          // centre cross
  const lbl = mk("div", "lbl", el); lbl.textContent = label;
  const c1 = 1.1, c3 = c1 + 1, ease = (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  const lerp = (a, b, s) => a + (b - a) * s;
  return {
    el,
    seek(f) {
      const k = f - start;
      if (k < 0) { el.style.visibility = "hidden"; return; }
      el.style.visibility = "visible";
      const t = clamp(k / dur), s = ease(t);
      const r = { x: lerp(from.x, to.x, s), y: lerp(from.y, to.y, s), w: lerp(from.w, to.w, s), h: lerp(from.h, to.h, s) };
      const a = Math.round(Math.min(30, r.w / 3, r.h / 3)), T = 3;
      const pos = [[r.x, r.y, "Top", "Left"], [r.x + r.w - a, r.y, "Top", "Right"], [r.x, r.y + r.h - a, "Bottom", "Left"], [r.x + r.w - a, r.y + r.h - a, "Bottom", "Right"]];
      cs.forEach((c, i) => {
        const [bx, by, v, h] = pos[i];
        Object.assign(c.style, { left: bx + "px", top: by + "px", width: a + "px", height: a + "px", borderWidth: 0 });
        c.style["border" + v + "Width"] = T + "px"; c.style["border" + h + "Width"] = T + "px";
      });
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, L = 44, G = 14;
      const set = (e, l, tp, w, h) => Object.assign(e.style, { left: l + "px", top: tp + "px", width: w + "px", height: h + "px", opacity: t });
      set(hl[0], cx, r.y - L - 8, 1, L); set(hl[1], cx, r.y + r.h + 8, 1, L);
      set(hl[2], r.x - L - 8, cy, L, 1); set(hl[3], r.x + r.w + 8, cy, L, 1);
      set(tick[0], cx - G - 12, cy, 12, 2); set(tick[1], cx + G, cy, 12, 2);
      set(tick[2], cx, cy - G - 12, 2, 12); set(tick[3], cx, cy + G, 2, 12);
      const locked = k >= dur;
      Object.assign(lbl.style, { left: r.x + "px", top: (r.y - 38) + "px", visibility: locked ? "visible" : "hidden" });
    },
  };
}

// ---------------------------------------------------------------- typer / slam
export function createTyper(parent, { text, n0 = 0, style, caret = true, x, y } = {}) {
  const el = mk("div", "fx-typer", parent);
  if (x !== undefined) Object.assign(el.style, { position: "absolute", left: px(x), top: px(y) });
  if (style) Object.assign(el.style, style);
  const a = mk("span", "", el), cr = caret ? mk("span", "caret", el) : null, b = mk("span", "rest", el);
  const count = (f) => typedCount(text, n0, f);
  return {
    el, count,
    seek(f) {
      const c = count(f);
      a.textContent = text.slice(0, c); b.textContent = text.slice(c);
      if (cr) cr.style.visibility = c < text.length || Math.floor(f / 7) % 2 === 0 ? "visible" : "hidden";
    },
  };
}

export function slam(el, f, start, { from = 1.25, frames = 4, base = "" } = {}) {
  const k = f - start;
  if (k < 0) { el.style.opacity = "0"; return; }
  const t = clamp(k / frames), s = 1 + (from - 1) * Math.pow(1 - t, 3);
  el.style.opacity = "1";
  el.style.transform = `${base} scale(${s.toFixed(4)})`.trim();
}
