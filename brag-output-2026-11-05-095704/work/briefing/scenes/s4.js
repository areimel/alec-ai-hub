// s4 Fill and copy (f260-364): two synced iframes of the real /prompts/board-update/ page.
// Left = real form fields, right = real #promptContent. Typing goes through setInput so the real script fires.
import { SYNC, SCENES, typedCount, s16Frame } from "/__comp/timeline.js";
import { loadPage, setInput, setCopied, createCaption } from "/engine/lib.js";
import { createHudFrame, slam } from "/engine/fx.js";

const SC = SCENES.find((s) => s.id === "s4");
const URL_ = "/prompts/board-update/";
const SCALE = 1.5, CW = 560, CH = 446, STRIP = 56;   // pane = 840 x 660 px
const PX = 96, PX2 = 984, PY = 110;                  // pane origins
let S;

const BASE = `
header, aside.dossier__rail, .skip-link, footer{display:none!important}
body{background:#141310!important}
.dossier__sheet{border:0!important;background:transparent!important}
.mx-auto{padding-left:14px!important;padding-right:14px!important}
.dossier__template{border:0!important;background:transparent!important;padding:0 8px!important}
body::after{content:"";position:fixed;left:0;right:0;top:0;height:${STRIP}px;background:#1c1b17;border-bottom:2px solid #ff4d00;z-index:99}
`;
const LEFT = `
body::before{content:"INPUT / TEMPLATE FIELDS";display:block;position:fixed;left:16px;top:0;height:${STRIP}px;z-index:100;
  font:500 16px ui-monospace,"Liberation Mono",monospace;line-height:${STRIP}px;letter-spacing:.16em;color:#ff4d00}
.form-group:has(#var-companyName){order:-3}.form-group:has(#var-biggestRisk){order:-2}.form-group:has(#var-decisionNeeded){order:-1}
#templateForm{gap:14px 16px!important}
.dossier__input{height:54px!important;font-size:21px!important;padding:0 14px!important;border-radius:0!important;background:#1c1b17!important;color:#efebe0!important;border:2px solid #3f3b31!important}
.dossier__label{font-size:15px!important;color:#aaa596!important}
.dossier__input::placeholder{font-size:16px!important}
`;
const RIGHT = `
body::before{content:"OUTPUT / LIVE PROMPT";display:block;position:fixed;left:16px;top:0;height:${STRIP}px;z-index:100;
  font:500 16px ui-monospace,"Liberation Mono",monospace;line-height:${STRIP}px;letter-spacing:.16em;color:#ff4d00}
#copyPrompt{position:fixed!important;top:7px!important;right:12px!important;z-index:101!important;height:42px!important;font-size:15px!important;padding:0 18px!important}
#copyPrompt[data-copied=true]{background:#efebe0!important;color:#141310!important;border-color:#efebe0!important;font-size:25px!important;height:52px!important;top:2px!important;padding:0 30px!important;font-weight:700!important}
#promptContent{font-size:17px!important;line-height:1.5!important;color:#aaa596!important;background:#141310!important;border:0!important}
::highlight(blank){color:#ff4d00}
::highlight(resolved){color:#efebe0;text-decoration:underline;text-decoration-color:#ff4d00;text-decoration-thickness:3px}
::highlight(fresh){background-color:#ff4d00;color:#141310}
`;

function pane(root, x, label) {
  const p = document.createElement("div");
  Object.assign(p.style, { position: "absolute", left: x + "px", top: PY + "px", width: CW * SCALE + "px", height: CH * SCALE + "px", overflow: "hidden", background: "#141310" });
  root.appendChild(p);
  return p;
}
function frameBorder(root, x) {
  S_borders = S_borders || [];
  const b = document.createElement("div");
  Object.assign(b.style, { position: "absolute", left: x + "px", top: PY + "px", width: CW * SCALE - 4 + "px", height: CH * SCALE - 4 + "px", border: "2px solid #3f3b31", pointerEvents: "none", zIndex: 5 });
  root.appendChild(b); S_borders.push(b);
}
let S_borders;
const inject = (doc, css) => { const s = doc.createElement("style"); s.textContent = css; doc.head.appendChild(s); };

export async function mount(root) {
  const pl = pane(root, PX), pr = pane(root, PX2);
  const L = await loadPage(pl, URL_, { width: CW, height: CH, scale: SCALE, until: "#var-companyName" });
  const R = await loadPage(pr, URL_, { width: CW, height: CH, scale: SCALE, until: "#var-companyName" });
  inject(L.doc, BASE + LEFT); inject(R.doc, BASE + RIGHT);
  await L.doc.fonts.ready; await R.doc.fonts.ready;
  frameBorder(root, PX); frameBorder(root, PX2);
  const pre = R.doc.querySelector("#promptContent"), copy = R.doc.querySelector("#copyPrompt");
  if (!pre || !copy) throw new Error("s4: prompt content or copy button missing");
  const copyLabel = copy.textContent.trim();
  if (!R.win.CSS || !R.win.CSS.highlights) throw new Error("s4: CSS highlight API unavailable");
  const original = pre.textContent;

  const hud = createHudFrame(root, { tl: "AI HUB / PROMPT RESEARCH BUREAU", tr: "BUSINESS / CLAUDE", bl: "", br: "" });
  const cap = createCaption(root, "MISSION 01", "Fill it in. The prompt updates as you type.");
  Object.assign(cap.style, { paddingTop: "40px", paddingBottom: "52px" });
  Object.assign(cap.querySelector(".cap__line").style, { fontSize: "84px", whiteSpace: "nowrap", letterSpacing: "-0.035em" });
  cap.querySelector(".cap__kicker").style.fontSize = "40px";
  const tag = document.createElement("div");
  tag.textContent = "MISSION READY";
  Object.assign(tag.style, { position: "absolute", left: "96px", top: "806px", zIndex: 101, background: "#ff4d00", color: "#141310", padding: "6px 28px 4px",
    font: "700 68px/1.2 ui-monospace,'Liberation Mono',monospace", letterSpacing: ".08em" });
  root.appendChild(tag);
  S = { L, R, pre, copy, copyLabel, original, hud, cap, tag, measured: false, scroll: 0 };
}

// Layout exists only while displayed, so scroll offsets are measured on the first seek (pristine, unfilled state).
function measure() {
  const { L, R, pre, original } = S;
  const tn = pre.firstChild;
  const rangeOf = (a, b) => { const r = R.doc.createRange(); r.setStart(tn, a); r.setEnd(tn, b); return r.getBoundingClientRect(); };
  const iI = original.indexOf("## Instructions"), iEnd = original.length;
  if (iI < 0) throw new Error("s4: prompt structure changed");
  const para = rangeOf(iI, iEnd);
  // Snap so a full text line sits just under the header strip (no half-cut line).
  const lh = parseFloat(R.win.getComputedStyle(pre).lineHeight), g0 = rangeOf(0, 1).top;
  const want = para.bottom + 14 - CH;
  const scroll = Math.round(g0 + Math.ceil((want + STRIP + 6 - g0) / lh) * lh - STRIP - 6);
  S.scroll = scroll;
  const g = L.doc.querySelector("#templateForm .form-group");
  S.lscroll = Math.round(g.getBoundingClientRect().top - STRIP - 8);
  S.measured = true;
}

// Source of truth for substituted spans: mirrors template-menu.ts render() over the original text.
function spans(original, values) {
  const out = []; let pos = 0, text = "";
  for (const m of original.matchAll(/@(\w+)\b/g)) {
    text += original.slice(pos, m.index); pos = m.index + m[0].length;
    const v = values[m[1]];
    if (v) { out.push({ name: m[1], a: text.length, b: text.length + v.length, resolved: true }); text += v; }
    else out.push({ name: m[1], a: text.length, b: text.length + m[0].length, resolved: false }), text += m[0];
  }
  return { out, text: text + original.slice(pos) };
}

export function seek(f) {
  if (!S.measured) measure();
  const { L, R, pre, copy, copyLabel, original, hud, cap, tag } = S;
  const values = {};
  let active = null;
  for (const fl of SYNC.fields) {
    const n = typedCount(fl.text, fl.n0, f), v = fl.text.slice(0, n);
    values[fl.field] = v;
    setInput(L.doc, "#var-" + fl.field, v);
    setInput(R.doc, "#var-" + fl.field, v);
    const fresh = n > 0 && f < s16Frame(fl.n0 + fl.text.length - 1) + 8;
    fl.fresh = fresh;
    if (fresh) active = fl.field;
  }
  // Left: orange border on the field being typed, ivory on filled ones.
  L.doc.querySelectorAll(".dossier__input").forEach((i) => {
    const c = i.id === "var-" + active ? "#ff4d00" : i.value ? "#efebe0" : "#3f3b31";
    i.style.setProperty("border-color", c, "important");
  });
  L.win.scrollTo(0, S.lscroll);
  R.win.scrollTo(0, S.scroll);
  // Right: decryption highlights, built from the real text node.
  const { out, text } = spans(original, values);
  if (pre.textContent !== text) throw new Error("s4: prompt text does not match the real render");
  pre.normalize();
  const tn = pre.firstChild, H = R.win.Highlight, reg = R.win.CSS.highlights;
  const mk = (flt) => { const h = new H(); for (const s of out.filter(flt)) { const r = R.doc.createRange(); r.setStart(tn, s.a); r.setEnd(tn, s.b); h.add(r); } return h; };
  const freshNames = SYNC.fields.filter((x) => x.fresh).map((x) => x.field);
  reg.set("blank", mk((s) => !s.resolved));
  reg.set("resolved", mk((s) => s.resolved && !freshNames.includes(s.name)));
  reg.set("fresh", mk((s) => s.resolved && freshNames.includes(s.name)));
  // Real Copy prompt button flips to Copied at copyPress (never clicked).
  setCopied(copy, f >= SYNC.copyPress, copyLabel);
  hud.seek(f);
  const kk = f - SYNC.copyPress, hit = kk >= 0 && kk < 14;
  S_borders.forEach((b, i) => { b.style.borderColor = hit && i === 1 ? "#ff4d00" : "#3f3b31"; b.style.borderWidth = hit && i === 1 ? "6px" : "2px"; });
  slam(cap.querySelector(".cap__line"), f, SC.start, { from: 1.06, frames: 4 });
  const ready = f >= SYNC.copyPress && f < SC.end - 1;
  tag.style.display = ready ? "block" : "none";
  cap.querySelector(".cap__kicker").style.visibility = ready ? "hidden" : "visible";
  if (ready) slam(tag, f, SYNC.copyPress, { from: 1.3, frames: 4 });
}
