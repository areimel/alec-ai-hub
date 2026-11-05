// Usage (from repo root): node <path>/engine/render.mjs --cut briefing|trailer [--stills f1,f2] [--contact] [--full] [--workers N]
//   [--mux] [--poster F] [--determinism F] [--strict] [--check] [--port P]
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listen } from "./server.mjs";

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.resolve(ENGINE, "..");
const OUT = path.resolve(WORK, "..");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const cutName = val("--cut");
if (!cutName || !fs.existsSync(path.join(WORK, cutName, "timeline.js"))) { console.error("usage: render.mjs --cut briefing|trailer [options]"); process.exit(2); }
const strict = has("--strict");
const port = Number(val("--port") || 4599);
const nWorkers = Math.max(1, Number(val("--workers") || 4));
const cutDir = path.join(WORK, cutName);
const stillsDir = path.join(cutDir, "stills");
const { W, H, FPS, TOTAL, BEAT, CUT, SCENES } = await import(pathToFileURL(path.join(cutDir, "timeline.js")).href);
const sh = (cmd, a, opts = {}) => { const r = spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28, ...opts }); if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr}`); return r; };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const t0 = Date.now();
const lap = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

async function launch() {
  const opts = { headless: true };
  try { return await chromium.launch(opts); }
  catch (e) { console.warn("chromium launch failed, falling back to google-chrome:", e.message.split("\n")[0]); return chromium.launch({ ...opts, executablePath: "/usr/bin/google-chrome" }); }
}

async function openPage(browser, errors) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, serviceWorkers: "block" });
  await ctx.route("**/*", (route) => {
    const u = route.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("about:")) return route.continue();
    let host = ""; try { host = new URL(u).hostname; } catch {}
    return host === "127.0.0.1" ? route.continue() : route.abort();
  });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(`[page ${m.type()}] ${m.text()}`); });
  page.on("pageerror", (e) => { errors.push(e); console.error("[pageerror]", e.message); });
  await page.goto(`http://127.0.0.1:${port}/engine/index.html${strict ? "?strict" : ""}`);
  await page.evaluate((ms) => Promise.race([window.__ready, new Promise((_, rej) => setTimeout(() => rej(new Error("__ready timed out after " + ms + "ms")), ms))]), 180000)
    .catch((e) => { throw new Error("__ready failed: " + e.message); });
  if (strict && errors.length) throw new Error("page errors in strict mode");
  page.shot = async (f, type = "png") => {
    await page.evaluate((f) => window.__seek(f), f);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
    return page.screenshot({ type, animations: "disabled", caret: "hide", ...(type === "jpeg" ? { quality: 92 } : {}) });
  };
  return page;
}

async function main() {
  const server = await listen(port, cutDir);
  let browser;
  try {
    browser = await launch();
    const errors = [];
    const page = await openPage(browser, errors);
    lap(`ready: ${CUT.id} ${W}x${H} ${FPS}fps ${TOTAL}f`);

    if (val("--stills")) {
      fs.mkdirSync(stillsDir, { recursive: true });
      for (const s of val("--stills").split(",").map(Number)) {
        const f = path.join(stillsDir, `f${s}.png`);
        fs.writeFileSync(f, await page.shot(s)); console.log("wrote", f);
      }
    }

    if (has("--contact")) {
      fs.mkdirSync(stillsDir, { recursive: true });
      const frames = [];
      for (const s of SCENES) for (const f of [s.start + 2, Math.floor((s.start + s.end) / 2), s.end - 1]) if (!frames.includes(f)) frames.push(f);
      const tmp = fs.mkdtempSync(path.join(stillsDir, "c-"));
      const font = path.join(WORK, "site/fonts/dm-sans/DMSans-Bold.ttf");
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i], sc = SCENES.find((s) => f >= s.start && f < s.end);
        const raw = path.join(tmp, `r${i}.png`);
        fs.writeFileSync(raw, await page.shot(f));
        sh("ffmpeg", ["-y", "-v", "error", "-i", raw, "-vf",
          `scale=480:270,drawtext=fontfile=${font}:text='${sc.id} f${f}':x=8:y=8:fontsize=26:fontcolor=0xff4d00:box=1:boxcolor=0x141310@0.85:boxborderw=5`,
          path.join(tmp, `c${String(i).padStart(3, "0")}.png`)]);
        fs.rmSync(raw);
      }
      const out = path.join(stillsDir, "contact.jpg");
      const rows = Math.ceil(frames.length / 4);
      sh("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-i", path.join(tmp, "c%03d.png"), "-vf", `tile=4x${rows}:padding=4:color=0x000000`, "-frames:v", "1", "-q:v", "3", out]);
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log("wrote", out, `(${frames.length} tiles)`);
    }

    let posterPng;
    if (has("--poster")) {
      const pf = Number(val("--poster"));
      posterPng = await page.shot(pf);
      const tmpPng = path.join(OUT, ".poster-tmp.png");
      fs.writeFileSync(tmpPng, posterPng);
      sh("ffmpeg", ["-y", "-v", "error", "-i", tmpPng, "-q:v", "2", path.join(OUT, CUT.out + ".jpg")]);
      fs.rmSync(tmpPng);
      console.log("wrote", path.join(OUT, CUT.out + ".jpg"));
    }

    if (has("--determinism")) {
      const f = Number(val("--determinism"));
      const a = sha(await page.shot(f));
      await page.shot((f + 97) % TOTAL);
      const b = sha(await page.shot(f));
      console.log(`determinism f=${f}: ${a === b ? "PASS" : "FAIL"} (${a.slice(0, 12)} vs ${b.slice(0, 12)})`);
      if (a !== b) process.exitCode = 1;
    }

    if (has("--check")) {
      let checkExcluded;
      try { ({ checkExcluded } = await import(pathToFileURL(path.join(WORK, "check-excluded.mjs")).href)); }
      catch (e) { throw new Error("cannot import work/check-excluded.mjs: " + e.message); }
      let total = 0;
      for (const s of SCENES) for (const f of [Math.floor((s.start + s.end) / 2), s.end - 1]) {
        await page.shot(f);
        const hits = (await checkExcluded(page)) || [];
        console.log(`check ${s.id} f${f}: ${hits.length ? "HITS " + JSON.stringify(hits) : "clean"}`);
        total += hits.length;
      }
      console.log(`check total hits: ${total}`);
      if (total) process.exitCode = 1;
    }

    if (has("--full")) {
      const framesDir = path.join(cutDir, ".frames");
      fs.rmSync(framesDir, { recursive: true, force: true });
      fs.mkdirSync(framesDir, { recursive: true });
      const name = (f) => path.join(framesDir, `f${String(f).padStart(4, "0")}.png`);
      const per = Math.ceil(TOTAL / nWorkers);
      let done = 0;
      const worker = async (k) => {
        const lo = k * per, hi = Math.min(TOTAL, lo + per);
        if (lo >= hi) return;
        const p = k === 0 ? page : await openPage(browser, errors);
        for (let f = lo; f < hi; f++) {
          fs.writeFileSync(name(f), f === 0 && posterPng ? posterPng : await p.shot(f));
          if (++done % 100 === 0) lap(`frames ${done}/${TOTAL}`);
        }
      };
      await Promise.all(Array.from({ length: nWorkers }, (_, k) => worker(k)));
      lap(`captured ${done} frames with ${nWorkers} workers; encoding`);
      const outFile = path.join(cutDir, "video-noaudio.mp4");
      sh("ffmpeg", ["-y", "-v", "error", "-framerate", String(FPS), "-start_number", "0", "-i", path.join(framesDir, "f%04d.png"), "-frames:v", String(TOTAL),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-r", String(FPS), "-movflags", "+faststart", outFile]);
      fs.rmSync(framesDir, { recursive: true, force: true });
      const n = sh("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames,width,height,r_frame_rate", "-of", "default=nw=1", outFile]).stdout;
      console.log("wrote", outFile + "\n" + n);
      if (!n.includes(`nb_read_frames=${TOTAL}`)) { console.error("FRAME COUNT MISMATCH"); process.exitCode = 1; }
    }

    if (has("--mux")) {
      const v = path.join(cutDir, "video-noaudio.mp4"), a = path.join(cutDir, "audio.wav"), o = path.join(OUT, CUT.out + ".mp4");
      for (const f of [v, a]) if (!fs.existsSync(f)) throw new Error("missing " + f);
      sh("ffmpeg", ["-y", "-v", "error", "-i", v, "-i", a, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", "20.8", o]);
      console.log("wrote", o);
      console.log(sh("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,start_time,duration:format=duration,size", "-of", "default=nw=1", o]).stdout);
      const c = sh("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames,start_time", "-of", "default=nw=1", o]).stdout;
      console.log(c);
      if (!c.includes(`nb_read_frames=${TOTAL}`) || !/start_time=0(\.0+)?\b/.test(c)) { console.error("MUX VERIFY FAILED"); process.exitCode = 1; }
    }
    lap("done");
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }
}
main().then(() => process.exit(process.exitCode || 0), (e) => { console.error("RENDER FAILED:", e.message); process.exit(1); });
