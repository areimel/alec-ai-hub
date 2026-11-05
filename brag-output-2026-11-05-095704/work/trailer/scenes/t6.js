import { C, SYNC, W, H, scene, fonts, bigLines, pop, div } from "./_shared.js";
import { loadPage, setInput } from "/engine/lib.js";
import { typedCount } from "/__comp/timeline.js";
const sc = scene("t6");
const SCALE = 3.2, VW = W / SCALE, VH = 218, BAND = Math.round(VH * SCALE);
let page, pre, title;

// Isolate the real #promptContent: nothing else on the page is visible, rail and form included.
const CSS = `
body *{visibility:hidden!important}
#promptContent,#promptContent *{visibility:visible!important}
html,body{background:#1c1b17!important;margin:0!important}
#promptContent{position:fixed!important;left:0!important;top:28px!important;width:${VW}px!important;height:${VH - 28}px!important;margin:0!important;padding:0 30px!important;box-sizing:border-box!important;overflow:hidden!important;max-height:none!important;border:0!important;background:#1c1b17!important;z-index:99999!important;font-size:13px!important;line-height:19px!important;white-space:pre-wrap!important}
#promptContent .hl{background:#ff4d00;color:#141310}
#promptContent .gone{visibility:hidden!important}
`;
// First-occurrence value lines to highlight and keep in view, per field.
const LINES = { productName: "- Product/Service Name: ", painPoints: "- Customer Pain Points: " };

// Normalise the pre (pure) and mark: the unfillable token is hidden, filled/pending values highlighted.
function decorate(values) {
  const text = pre.textContent;
  pre.textContent = text;
  const marks = [];
  const tok = text.indexOf("@conditionalTestimonials");
  if (tok >= 0) marks.push({ a: tok, b: tok + "@conditionalTestimonials".length, cls: "gone" });
  for (const [name, prefix] of Object.entries(LINES)) {
    const a = text.indexOf(prefix);
    if (a < 0) continue;
    const s = a + prefix.length, e = text.indexOf("\n", s);
    marks.push({ a: s, b: e < 0 ? text.length : e, cls: "hl" });
  }
  marks.sort((m, n) => m.a - n.a);
  const frag = document.createDocumentFragment(); let pos = 0;
  for (const m of marks) {
    frag.append(text.slice(pos, m.a));
    const sp = page.doc.createElement("span"); sp.className = m.cls; sp.textContent = text.slice(m.a, m.b); frag.append(sp);
    pos = m.b;
  }
  frag.append(text.slice(pos));
  pre.replaceChildren(frag);
}

export async function mount(root) {
  await fonts();
  root.style.background = C.charcoal;
  const holder = div(root, { left: 0, top: 0, width: W + "px", height: BAND + "px", overflow: "hidden", background: C.panel });
  page = await loadPage(holder, "/prompts/marketing-email-template/", { width: VW, height: VH, scale: SCALE, until: "#var-productName" });
  const st = page.doc.createElement("style"); st.textContent = CSS; page.doc.head.appendChild(st);
  pre = page.doc.querySelector("#promptContent");
  div(root, { left: 0, top: BAND + "px", width: W + "px", height: "6px", background: C.orange });
  title = bigLines(root, ["FILL IT IN."], { maxW: 1740, centerX: true, y: BAND + 70, lh: 0.86 });
  title.el.style.top = Math.round(BAND + (H - BAND - title.h) / 2 + 6) + "px";
}

export function seek(f) {
  for (const { field, text, n0 } of SYNC.fields) setInput(page.doc, "#var-" + field, text.slice(0, typedCount(text, n0, f)));
  decorate();
  // scroll so the two value lines sit in view and nothing after them does
  pre.scrollTop = 19 * 2;
  pop(title.el, f, sc.start, { from: 1.12, frames: 4 });
}
