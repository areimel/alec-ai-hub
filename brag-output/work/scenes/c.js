import { SYNC, typedCount } from "/__comp/timeline.js";
import { loadPage, setInput, setCopied, createCursor, createCaption, ramp, lerp, easeInOut, easeOut } from "/__comp/lib.js";

const PATH = "/prompts/ai-prompt-template/";
const ORANGE = "#ff4d00";
const TOP_H = 215;          // top crop height (composition px)
const BOT_Y = 216, BOT_H = 1080 - 216;
const TOP = { w: 720, scale: 1.5 }, BOT = { w: 540, scale: 2 };
const FIELDS = [SYNC.role, SYNC.objective];
let st;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function crop(parent, top, h) {
  const d = document.createElement("div");
  Object.assign(d.style, { position: "absolute", left: 0, top: top + "px", width: "1080px", height: h + "px", overflow: "hidden" });
  parent.appendChild(d);
  return d;
}
async function view(parent, o, h) {
  const p = await loadPage(parent, PATH, { width: o.w, height: Math.ceil(h / o.scale) + 20, scale: o.scale, until: "#var-role" });
  const css = p.doc.createElement("style");
  css.textContent = `header, .site-header, [data-site-header]{display:none!important} #templateMenu .dossier__note{display:none!important}`;
  p.doc.head.appendChild(css);
  p.original = p.doc.getElementById("promptContent").textContent;
  return p;
}

export async function mount(root) {
  const topCrop = crop(root, 0, TOP_H);
  const botCrop = crop(root, BOT_Y, BOT_H);
  const rule = document.createElement("div");
  Object.assign(rule.style, { position: "absolute", left: 0, top: TOP_H + "px", width: "1080px", height: "1px", background: "#3f3b31", zIndex: 5 });
  root.appendChild(rule);
  const top = await view(topCrop, TOP, TOP_H);
  const bot = await view(botCrop, BOT, BOT_H);
  const cursor = createCursor(root);
  const capFill = createCaption(root, "Fill in", "Type your details in and the prompt updates as you go.");
  const capCopy = createCaption(root, "Copy", "Press copy.");
  st = { top, bot, cursor, capFill, capCopy, m: null };
}

// Mounted hidden (no layout), so measure on first seek and cache. Layout above #promptContent never depends on input values.
function measure() {
  if (st.m) return;
  const r = (p, sel) => p.doc.querySelector(sel).getBoundingClientRect();
  const sy = (p) => p.win.scrollY;
  const role = r(st.top, "#var-role"), obj = r(st.top, "#var-objective");
  const form = r(st.top, "#templateForm");
  const label = st.top.doc.querySelector("label[for=var-role]").getBoundingClientRect();
  const copy = r(st.bot, "#copyPrompt");
  const pre = r(st.bot, "#promptContent");
  const y0t = sy(st.top), y0b = sy(st.bot);
  st.m = {
    topScroll: st.top.doc.getElementById("template-title").getBoundingClientRect().top + y0t - 22,
    role: { x: role.left, y: role.top + y0t, w: role.width, h: role.height },
    obj: { x: obj.left, y: obj.top + y0t, w: obj.width, h: obj.height },
    botScroll: copy.top + y0b - 24,
    copy: { x: copy.left, y: copy.top + y0b, w: copy.width, h: copy.height },
  };
}

function highlight(p, vals) {
  const pre = p.doc.getElementById("promptContent");
  const parts = p.original.split(/(@role\b|@objective\b)/);
  const html = parts.map((s) => {
    if (s === "@role" || s === "@objective") {
      const v = vals[s.slice(1)];
      return `<span style="color:${ORANGE}">${esc(v || s)}</span>`;
    }
    return esc(s);
  }).join("");
  if (pre.innerHTML !== html) pre.innerHTML = html;
}

function focusStyle(input, on) {
  input.style.borderColor = on ? ORANGE : "";
  input.style.boxShadow = on ? "0 0 0 3px rgba(255,77,0,.28)" : "";
}

export function seek(t) {
  measure();
  const { top, bot, m, cursor, capFill, capCopy } = st;
  top.scrollTo(m.topScroll);
  bot.scrollTo(m.botScroll);

  const vals = {};
  for (const f of FIELDS) {
    const n = typedCount(f.text, f.start, t);
    vals[f.field] = f.text.slice(0, n);
    for (const p of [top, bot]) setInput(p.doc, "#var-" + f.field, vals[f.field]);
  }
  // focus ring: field is "active" while typing it and a beat after
  const roleOn = t >= SYNC.role.start && t < SYNC.objective.start;
  const objOn = t >= SYNC.objective.start && t < SYNC.copyPress - 0.5;
  focusStyle(top.doc.getElementById("var-role"), roleOn);
  focusStyle(top.doc.getElementById("var-objective"), objOn);
  highlight(bot, vals);
  highlight(top, vals);

  // Real copy button state
  const btn = bot.doc.getElementById("copyPrompt");
  setCopied(btn, t >= SYNC.copyPress, "Copy prompt");

  // Cursor (composition px). Fields live in the top view.
  const fx = (f) => (f.x + f.w * 0.6) * TOP.scale, fy = (f) => (f.y - m.topScroll + f.h / 2) * TOP.scale;
  const bx = (m.copy.x + m.copy.w * 0.84) * BOT.scale, by = BOT_Y + (m.copy.y - m.botScroll + m.copy.h * 0.4) * BOT.scale;
  const a = ramp(t, 9.1, 9.5, easeOut);
  const b = ramp(t, 11.1, 11.45, easeInOut);
  const c = ramp(t, 13.0, 13.85, easeInOut);
  let x = lerp(lerp(1010, fx(m.role), a), fx(m.obj), b);
  let y = lerp(lerp(760, fy(m.role), a), fy(m.obj), b);
  x = lerp(x, bx, c); y = lerp(y, by, c);
  const press = ramp(t, SYNC.copyPress, SYNC.copyPress + 0.08, (k) => k) * (1 - ramp(t, SYNC.copyPress + 0.3, SYNC.copyPress + 0.45, (k) => k));
  const d = ramp(t, SYNC.copyPress + 0.05, SYNC.copyPress + 0.25, easeOut);
  x -= 150 * d; y += 265 * d;
  cursor.set(x, y, press, ramp(t, 9.0, 9.15, (k) => k));

  // Captions
  const show = (el, k) => { for (const c of el.children) { c.style.opacity = k; c.style.transform = `translateY(${(1 - k) * 24}px)`; } };
  const capSwap = SYNC.copyPress - 0.5; // typing ends here; the Copy caption sets up the press
  const fillIn = ramp(t, 9.0, 9.15, easeOut) * (t < capSwap ? 1 : 0);
  capCopy.style.display = t >= capSwap ? "" : "none";
  show(capFill, fillIn);
  show(capCopy, ramp(t, capSwap, capSwap + 0.15, easeOut));
}
