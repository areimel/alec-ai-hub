// Shared helpers for the trailer scenes. Pure DOM builders; every scene seek() is a pure function of the frame.
import { SCENES, SYNC, W, H } from "/__comp/timeline.js";
import { loadPage } from "/engine/lib.js";
import { createRadarSweep, clamp } from "/engine/fx.js";

export { SYNC, W, H };
export const C = { charcoal: "#141310", panel: "#1c1b17", ivory: "#efebe0", orange: "#ff4d00", rule: "#3f3b31", muted: "#aaa596" };
export const DISPLAY = '"DM Sans","Liberation Sans",sans-serif';
export const MONO = 'ui-monospace,"Liberation Mono",monospace';
export const TRACK = -0.045; // display tracking, em
export const scene = (id) => SCENES.find((s) => s.id === id);

export function div(parent, css = {}, text) {
  const e = document.createElement("div");
  Object.assign(e.style, { position: "absolute" }, css);
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

export async function fonts() {
  await document.fonts.load('700 100px "DM Sans"');
  await document.fonts.load('500 40px "DM Sans"');
  await document.fonts.ready;
}

// Width in px of `text` set in DM Sans 700 at 100px with the given tracking (em).
export function widthAt100(text, spacing = TRACK, family = DISPLAY, weight = 700) {
  const s = document.createElement("span");
  Object.assign(s.style, { position: "absolute", visibility: "hidden", whiteSpace: "nowrap", font: `${weight} 100px ${family}`, letterSpacing: spacing + "em" });
  s.textContent = text;
  document.body.appendChild(s);
  const w = s.getBoundingClientRect().width;
  s.remove();
  return w;
}
export const fitSize = (lines, maxW, spacing = TRACK) => (maxW / Math.max(...lines.map((l) => widthAt100(l, spacing)))) * 100;

// Block of display lines. Returns {el, lines:[div], size, w, h}. Left aligned inside a block of its natural width.
export function bigLines(parent, lines, { size, maxW, maxH, lh = 0.86, color = C.ivory, spacing = TRACK, x, y, centerX = false, centerY = false, weight = 700 } = {}) {
  let sz = size ?? fitSize(lines, maxW, spacing);
  if (maxH) sz = Math.min(sz, maxH / (lines.length * lh));
  const w = Math.ceil(Math.max(...lines.map((l) => widthAt100(l, spacing))) * sz / 100) + 4, h = Math.round(sz * lh * lines.length);
  const el = div(parent, { width: w + "px", height: h + "px", left: (centerX ? (W - w) / 2 : x) + "px", top: (centerY ? (H - h) / 2 : y) + "px" });
  const ls = lines.map((t, i) => div(el, { left: 0, top: Math.round(i * sz * lh) + "px", whiteSpace: "nowrap", font: `${weight} ${sz}px/${lh} ${DISPLAY}`, letterSpacing: spacing + "em", color }, t));
  return { el, lines: ls, size: sz, w, h };
}

// Scene-local slam: opacity 0 before start, scale from..1 over `frames` (cubic ease-out). Never hides after.
export function pop(el, f, start, { from = 1.25, frames = 4, origin = "50% 50%", base = "" } = {}) {
  const k = f - start;
  el.style.transformOrigin = origin;
  if (k < 0) { el.style.opacity = "0"; return; }
  const t = clamp(k / frames), s = 1 + (from - 1) * Math.pow(1 - t, 3);
  el.style.opacity = "1";
  el.style.transform = `${base} scale(${s.toFixed(4)})`.trim();
}

// Thin progress bar along the bottom edge: grows across the scene in integer frames.
export function progressBar(parent, color, sc) {
  const b = div(parent, { left: 0, bottom: 0, height: "22px", width: "0px", background: color });
  return (f) => { b.style.width = Math.round(W * clamp((f - sc.start + 1) / (sc.end - sc.start))) + "px"; };
}

// Real home-page radar plate (iframe of `/`), isolated by injected CSS so only `.home-hero__plate` shows.
// plateW: css px width of the plate inside the iframe; (offX, offY): its position; (w,h): iframe viewport; scale: iframe transform.
export async function loadPlate(parent, { w, h, scale = 1, plateW, offX = 0, offY = 0, left = 0, top = 0, period = 104, start = 0 }) {
  const page = await loadPage(parent, "/", { width: w, height: h, scale, until: ".home-hero__plate svg" });
  const doc = page.doc;
  const st = doc.createElement("style");
  st.textContent = `html,body{background:${C.orange}!important;margin:0!important}
body *{visibility:hidden!important}
.home-hero__plate,.home-hero__plate *{visibility:visible!important}
.home-hero__plate{position:fixed!important;left:${offX}px!important;top:${offY}px!important;width:${plateW}px!important;margin:0!important;padding:0!important;max-width:none!important;transform:none!important;z-index:99999!important;border:0!important}`;
  doc.head.appendChild(st);
  page.frame.style.left = left + "px"; page.frame.style.top = top + "px";
  const svg = doc.querySelector(".home-hero__plate svg");
  const sweep = createRadarSweep(svg, { wedge: 'path[d^="M245 277L144"]', needle: 'path[d^="M245 277L379"]', period, start });
  return { ...page, svg, sweep };
}

// Facts from the real built DOM (never hard-coded).
export async function fetchDoc(path) {
  const html = await (await fetch(path)).text();
  return new DOMParser().parseFromString(html, "text/html");
}
