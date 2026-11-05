// Visible rendered text containing an excluded string (case-insensitive), top document plus frames.
// Form placeholder attributes are not text nodes, so they never match.
const NEEDLES = ['placeholder', 'Anonymous', 'Company AI Team', '2023-06-16', 'WeBasic', '@conditionalTestimonials', 'Kojima', 'localhost'];

// Totals must never appear: the site is early, so the videos don't sell on counts.
const COUNT_PATTERNS = [/PROMPTS\u2014\d/i, /AGENTS\u2014\d/i, /SKILLS\u2014\d/i, /\b\d+\s+PUBLISHED/i, /Showing\s+\d+\s+of\s+\d+/i, /\b\d+\s+(custom|prompts?|agents?|entries|skills?)\b/i, /\b(five|four|eighteen|thirty|nine|eight)\s+(custom|prompts?|agents?|skills?)\b/i, /\b\d+\s*\/\s*\d+\b(?!\s*%)/];

// Runs inside a frame. offset = frame origin in main-viewport coordinates; main = main viewport size.
function scanFrame({ needles, patterns, offset, main }) {
  const regexes = patterns.map((p) => new RegExp(p.source, p.flags));
  const hits = [];
  const hidden = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return true; } return false; };
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    const needle = needles.find((n) => node.nodeValue.toLowerCase().includes(n.toLowerCase())) ?? regexes.find((r) => r.test(node.nodeValue))?.source;
    if (!needle || !el || el.closest('script,style,noscript,template') || hidden(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const onScreen = [...range.getClientRects()].some((b) => {
      if (b.width <= 0 || b.height <= 0) return false;
      const inFrame = b.right > 0 && b.bottom > 0 && b.left < innerWidth && b.top < innerHeight;
      const x = b.left + offset.x, y = b.top + offset.y;
      return inFrame && x + b.width > 0 && y + b.height > 0 && x < main.w && y < main.h;
    });
    if (onScreen) hits.push({ needle, tag: el.tagName.toLowerCase(), text: node.nodeValue.trim().slice(0, 120) });
  }
  return hits;
}

export async function checkExcluded(page) {
  const vp = page.viewportSize() ?? { width: 1920, height: 1080 };
  const main = { w: vp.width, h: vp.height };
  const out = [];
  for (const frame of page.frames()) {
    // Sum iframe origins up to the main frame; skip frames whose iframe is hidden or empty.
    const offset = { x: 0, y: 0 };
    let f = frame, visible = true;
    while (f.parentFrame()) {
      const box = await (await f.frameElement()).evaluate((e) => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return s.display === 'none' || s.visibility === 'hidden' ? null : { x: r.x, y: r.y, w: r.width, h: r.height };
      }).catch(() => null);
      if (!box || box.w === 0 || box.h === 0) { visible = false; break; }
      offset.x += box.x; offset.y += box.y;
      f = f.parentFrame();
    }
    if (!visible) continue;
    const hits = await frame.evaluate(scanFrame, { needles: NEEDLES, patterns: COUNT_PATTERNS.map((r) => ({ source: r.source, flags: r.flags })), offset, main }).catch(() => []);
    for (const h of hits) out.push({ url: frame.url(), ...h });
  }
  return out;
}
