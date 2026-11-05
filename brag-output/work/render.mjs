import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listen } from "./server.mjs";

const WORK = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(WORK, "..");
const FPS = 30, TOTAL = 600, BEAT = 0.5;

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const strict = has("--strict");
const port = Number(val("--port") || 4599);
const limit = val("--limit") ? Number(val("--limit")) : TOTAL;
const posterT = val("--poster") !== undefined ? Number(val("--poster")) : undefined;
const sh = (cmd, a, opts = {}) => { const r = spawnSync(cmd, a, { encoding: "utf8", ...opts }); if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr}`); return r; };
const fmt = (t) => String(+t.toFixed(3));

async function main() {
  const server = await listen(port);
  let browser;
  try {
    const opts = { headless: true };
    try { browser = await chromium.launch(opts); }
    catch (e) { console.warn("chromium launch failed, falling back to google-chrome:", e.message.split("\n")[0]); browser = await chromium.launch({ ...opts, executablePath: "/usr/bin/google-chrome" }); }
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1, serviceWorkers: "block" });
    await ctx.route("**/*", (route) => {
      const u = route.request().url();
      if (u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("about:")) return route.continue();
      let host = ""; try { host = new URL(u).hostname; } catch {}
      return host === "127.0.0.1" ? route.continue() : route.abort();
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(`[page ${m.type()}] ${m.text()}`); });
    page.on("pageerror", (e) => { errors.push(e); console.error("[pageerror]", e.message); });
    await page.goto(`http://127.0.0.1:${port}/__comp/index.html${strict ? "?strict" : ""}`);
    await page.evaluate((ms) => Promise.race([window.__ready, new Promise((_, rej) => setTimeout(() => rej(new Error("__ready timed out after " + ms + "ms")), ms))]), 180000).catch((e) => { throw new Error("__ready failed: " + e.message); });
    if (strict && errors.length) throw new Error("page errors in strict mode");

    const shot = async (t, type = "png") => {
      await page.evaluate((t) => window.__seek(t), t);
      await page.evaluate(async () => { await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
      return page.screenshot({ type, animations: "disabled", caret: "hide", ...(type === "jpeg" ? { quality: 92 } : {}) });
    };

    // stills
    const stillsDir = path.join(WORK, "stills");
    if (val("--stills")) {
      fs.mkdirSync(stillsDir, { recursive: true });
      for (const s of val("--stills").split(",").map(Number)) {
        const f = path.join(stillsDir, `t${fmt(s)}.png`);
        fs.writeFileSync(f, await shot(s)); console.log("wrote", f);
      }
    }

    if (has("--contact")) {
      fs.mkdirSync(stillsDir, { recursive: true });
      const tmp = fs.mkdtempSync(path.join(stillsDir, "c-"));
      const n = 40;
      for (let i = 0; i < n; i++) fs.writeFileSync(path.join(tmp, `c${String(i).padStart(2, "0")}.png`), await shot(Math.min(i * BEAT, 20 - 1 / FPS)));
      const font = path.join(WORK, "site/fonts/dm-sans/DMSans-Bold.ttf");
      const out = path.join(stillsDir, "contact.jpg");
      sh("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-i", path.join(tmp, "c%02d.png"), "-vf",
        `scale=270:270,drawtext=fontfile=${font}:text='t=%{expr\\:n*0.5}s':x=8:y=8:fontsize=26:fontcolor=0xff4d00:box=1:boxcolor=0x141310@0.8:boxborderw=4,tile=8x5:padding=4:color=0x000000`,
        "-frames:v", "1", "-q:v", "3", out]);
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log("wrote", out);
    }

    let posterPng;
    if (posterT !== undefined) {
      posterPng = await shot(posterT);
      const tmpPng = path.join(OUT, ".poster-tmp.png");
      fs.writeFileSync(tmpPng, posterPng);
      sh("ffmpeg", ["-y", "-v", "error", "-i", tmpPng, "-q:v", "2", path.join(OUT, "brag.jpg")]);
      fs.rmSync(tmpPng);
      console.log("wrote", path.join(OUT, "brag.jpg"));
    }

    if (has("--determinism") ) {
      const t = Number(val("--determinism"));
      const h = (b) => crypto.createHash("sha256").update(b).digest("hex");
      const a = h(await shot(t));
      await shot((t + 7.3) % 20);
      const b = h(await shot(t));
      console.log(`determinism t=${t}: ${a === b ? "PASS" : "FAIL"} (${a.slice(0, 12)} vs ${b.slice(0, 12)})`);
      if (a !== b) process.exitCode = 1;
    }

    if (has("--full")) {
      const keep = has("--keep-frames");
      const framesDir = path.join(WORK, "frames");
      if (keep) fs.mkdirSync(framesDir, { recursive: true });
      const outFile = path.join(WORK, "video-noaudio.mp4");
      const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "png", "-i", "-",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-r", "30", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
      const done = new Promise((res, rej) => { ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exited " + c)))); ff.stdin.on("error", () => {}); });
      const n = Math.min(limit, TOTAL);
      for (let f = 0; f < n; f++) {
        const buf = f === 0 && posterPng ? posterPng : await shot(f / FPS);
        if (keep) fs.writeFileSync(path.join(framesDir, `f${String(f).padStart(4, "0")}.png`), buf);
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
        if ((f + 1) % 60 === 0 || f === n - 1) console.log(`frame ${f + 1}/${n}`);
      }
      ff.stdin.end();
      await done;
      console.log("wrote", outFile);
    }

    if (has("--mux")) {
      const v = path.join(WORK, "video-noaudio.mp4"), a = path.join(WORK, "audio.wav"), o = path.join(OUT, "brag.mp4");
      for (const f of [v, a]) if (!fs.existsSync(f)) throw new Error("missing " + f);
      sh("ffmpeg", ["-y", "-v", "error", "-i", v, "-i", a, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", "20", o]);
      console.log("wrote", o);
      console.log(sh("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,duration:format=duration,size", "-of", "default=nw=1", o]).stdout);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }
}
main().then(() => process.exit(process.exitCode || 0), (e) => { console.error("RENDER FAILED:", e.message); process.exit(1); });
