// Browser helpers shared by all scenes. Everything here is deterministic; no timers, no Date, no Math.random.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const backOut = (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
// 0..1 progress of t between a and b, eased.
export const ramp = (t, a, b, ease = easeOut) => ease(clamp((t - a) / (b - a)));
// Same over integer frames: 0..1 progress of frame f between frames a and b, eased.
export const rampF = (f, a, b, ease = easeOut) => ease(clamp((f - a) / (b - a)));

const FREEZE_CSS = `*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important;caret-color:transparent!important}
html,body{overflow:hidden!important} ::-webkit-scrollbar{display:none} :focus,:focus-visible{outline:none!important}`;

// Loads a real built page of the site into a same-origin iframe, frozen and scaled.
// Resolves once loaded, fonts ready, and the optional `until` selector exists.
export async function loadPage(parent, path, { width = 1920, height = 1080, scale = 1, until } = {}) {
  const f = document.createElement("iframe");
  f.src = path;
  f.setAttribute("tabindex", "-1");
  Object.assign(f.style, {
    position: "absolute", left: 0, top: 0, border: 0, width: width + "px", height: height + "px",
    transform: `scale(${scale})`, transformOrigin: "0 0", background: "transparent", pointerEvents: "none",
  });
  const loaded = new Promise((r) => f.addEventListener("load", r, { once: true }));
  parent.appendChild(f);
  await loaded;
  const doc = f.contentDocument;
  const s = doc.createElement("style"); s.textContent = FREEZE_CSS; doc.head.appendChild(s);
  if (until) { while (!doc.querySelector(until)) await new Promise((r) => requestAnimationFrame(r)); }
  await doc.fonts.ready;
  return { frame: f, doc, win: f.contentWindow, scrollTo: (y) => f.contentWindow.scrollTo(0, y) };
}

// Sets a real input's value and fires the real `input` event, only when the value changed.
export function setInput(doc, selector, value) {
  const el = doc.querySelector(selector);
  if (el && el.value !== value) { el.value = value; el.dispatchEvent(new Event("input", { bubbles: true })); }
}

// Shows the real copied state that src/scripts/copy.ts produces, without clicking (its 2s timer breaks purity).
export function setCopied(el, copied, label, confirmation = "Copied") {
  el.textContent = copied ? confirmation : label;
  if (copied) el.dataset.copied = "true"; else delete el.dataset.copied;
}

// Arrow cursor. Call .set(x, y, pressed) from seek(). Coordinates are composition pixels.
export function createCursor(parent) {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="72" height="72" viewBox="0 0 24 24"><path d="M5 2 L5 20 L10 15.5 L13.4 22.2 L16.4 20.7 L13 14.2 L19.4 14.2 Z" fill="#efebe0" stroke="#141310" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  Object.assign(el.style, { position: "absolute", left: 0, top: 0, zIndex: 50, transformOrigin: "10px 6px", willChange: "transform" });
  parent.appendChild(el);
  return {
    el,
    set(x, y, pressed = 0, visible = 1) {
      el.style.opacity = visible;
      el.style.transform = `translate(${x}px,${y}px) scale(${1 - 0.14 * pressed})`;
    },
  };
}

// Kicker + line caption bar (line is 64px at 1920). Style lives in comp.css (.cap, .cap__kicker, .cap__line).
export function createCaption(parent, kicker, line) {
  const el = document.createElement("div");
  el.className = "cap";
  el.innerHTML = `${kicker ? `<div class="cap__kicker"></div>` : ""}<div class="cap__line"></div>`;
  if (kicker) el.querySelector(".cap__kicker").textContent = kicker;
  el.querySelector(".cap__line").textContent = line;
  parent.appendChild(el);
  return el;
}
