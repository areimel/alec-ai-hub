import { SCENES, CUT, TOTAL } from "/__comp/timeline.js";

const strict = new URLSearchParams(location.search).has("strict");
const stage = document.getElementById("stage");
const items = [];
const failures = [];
let overlay = null;

function placeholder(root, sc) {
  root.innerHTML = `<div class="slate"><div class="slate__lbl">PLACEHOLDER ${CUT.id}</div><div class="slate__id"></div><div class="slate__lbl slate__fr"></div><div class="slate__bar"></div></div>`;
  root.querySelector(".slate__id").textContent = sc.id;
  return {
    seek(f) {
      root.querySelector(".slate__fr").textContent = `frame ${f}  [${sc.start}-${sc.end})`;
      root.querySelector(".slate__bar").style.width = ((f - sc.start) / (sc.end - sc.start)) * 1920 + "px";
    },
  };
}

async function mountAll() {
  for (const sc of SCENES) {
    const root = document.createElement("div");
    root.className = "scene";
    root.dataset.scene = sc.id;
    root.style.display = "none";
    stage.appendChild(root);
    const item = { ...sc, root, mod: null };
    items.push(item);
    try {
      const mod = await import(`/__comp/scenes/${sc.id}.js`);
      if (typeof mod.mount !== "function" || typeof mod.seek !== "function") throw new Error("scene must export mount() and seek()");
      await mod.mount(root);
      item.mod = mod;
    } catch (err) {
      const msg = `[comp] scene "${sc.id}" unavailable: ${(err && err.message) || err}`;
      failures.push(msg);
      if (strict) console.error(msg); else console.warn(msg);
      root.replaceChildren();
      if (!strict) item.mod = placeholder(root, sc);
    }
  }
  if (strict && failures.length) throw new Error(failures.join("\n"));
  try {
    const fx = await import("/engine/fx.js");
    if (typeof fx.createOverlay === "function") overlay = await fx.createOverlay(stage, { cuts: SCENES.map((s) => s.start), cutId: CUT.id });
  } catch (err) {
    if (strict && !/Failed to fetch|error loading dynamically|404|Unexpected token/i.test(String(err && err.message))) throw err;
    console.warn("[comp] no FX overlay:", err && err.message);
  }
  await document.fonts.load('700 46px "DM Sans"');
  await document.fonts.ready;
}

window.__failures = failures;
window.__ready = mountAll();
window.__ready.catch((e) => console.error("[comp] __ready rejected:", e));

function sceneIndex(f) {
  for (let i = 0; i < items.length; i++) if (f >= items[i].start && f < items[i].end) return i;
  return f < items[0].start ? 0 : items.length - 1;
}

// f: absolute INTEGER frame. Shows exactly the scene with start <= f < end.
window.__seek = function (f) {
  if (!items.length) return;
  if (!Number.isInteger(f)) { if (strict) throw new Error("__seek needs an integer frame, got " + f); f = Math.round(f); }
  const idx = sceneIndex(f);
  items.forEach((it, i) => { it.root.style.display = i === idx ? "block" : "none"; });
  const it = items[idx];
  if (it.mod) {
    try { it.mod.seek(f); } catch (err) {
      console.error(`[comp] scene "${it.id}" seek(${f}) threw: ${(err && err.stack) || err}`);
      if (strict) throw err;
    }
  }
  if (overlay) overlay.seek(f);
};
window.__scenes = SCENES;
window.__total = TOTAL;
