import { SCENES, DIP } from "/__comp/timeline.js";

const strict = new URLSearchParams(location.search).has("strict");
const stage = document.getElementById("stage");
const dip = document.getElementById("dip");
const items = [];
const failures = [];

async function mountAll() {
  for (const sc of SCENES) {
    const root = document.createElement("div");
    root.className = "scene";
    root.dataset.scene = sc.id;
    root.style.display = "none";
    stage.insertBefore(root, dip);
    const item = { ...sc, root, mod: null };
    items.push(item);
    try {
      const mod = await import(`/__comp/scenes/${sc.id}.js`);
      if (typeof mod.mount !== "function" || typeof mod.seek !== "function") throw new Error("scene must export mount() and seek()");
      await mod.mount(root);
      item.mod = mod;
    } catch (err) {
      const msg = `[comp] scene "${sc.id}" failed: ${err && err.stack || err}`;
      console.error(msg);
      failures.push(msg);
      root.replaceChildren();
    }
  }
  if (strict && failures.length) throw new Error(failures.join("\n"));
  await document.fonts.load('600 46px "DM Sans"');
  await document.fonts.ready;
}

window.__failures = failures;
window.__ready = mountAll();
window.__ready.catch((e) => console.error("[comp] __ready rejected:", e));

function sceneIndex(t) {
  let idx = 0;
  for (let i = 0; i < items.length; i++) if (t >= items[i].start) idx = i;
  return idx;
}

window.__seek = function (t) {
  if (!items.length) return;
  const last = items.length - 1;
  const idx = t >= items[last].end ? last : sceneIndex(t);
  items.forEach((it, i) => { it.root.style.display = i === idx ? "block" : "none"; });
  const it = items[idx];
  if (it.mod) {
    try { it.mod.seek(t); } catch (err) {
      const msg = `[comp] scene "${it.id}" seek(${t}) threw: ${err && err.stack || err}`;
      console.error(msg);
      if (strict) throw err;
    }
  }
  let o = 0;
  if (t > 0) {
    if (idx > 0 && t - it.start < DIP) o = 1 - (t - it.start) / DIP;
    else if (idx < last && t >= it.end - DIP) o = (t - (it.end - DIP)) / DIP;
  }
  dip.style.opacity = String(Math.min(1, Math.max(0, o)));
};
