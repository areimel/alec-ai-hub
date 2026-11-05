// Shared audio engine: acid bass, drums, stab, FX, buses, mix and master. Pure Node, deterministic.
// Cuts supply an arrangement only (see briefing/audio.mjs, trailer/audio.mjs).
// Grid: 48 kHz, 138.4615 BPM = 1800/13, beat 20800 samples, 16th 5200, bar 83200. Integer samples only.
import fs from 'node:fs';
import path from 'node:path';
import { SR, TOTAL_SAMPLES as N, SAMPLES_PER_FRAME, s16Sample } from './grid.js';

export const TAU = Math.PI * 2;
export const S16 = 5200, BEAT = 20800, BAR = 83200;
export const frameS = f => f * SAMPLES_PER_FRAME;
export { s16Sample, N, SR };
const db2 = d => Math.pow(10, d / 20);
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------- options (CLI) ----------
export function parseOpts(argv = process.argv.slice(2)) {
  const g = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? parseFloat(argv[i + 1]) : d; };
  return {
    basscut: g('basscut', 1),            // multiplier on acid base-cutoff automation (1 = as authored)
    bass: g('bass', 0), drums: g('drums', 0), fx: g('fx', 0),   // stem gains, dB
    rumble: g('rumble', 0), stab: g('stab', 0),
    lufs: g('lufs', -14), tp: g('tp', -1.6), // target integrated LUFS; true-peak ceiling dBTP
    seed: g('seed', 1138),
  };
}

// ---------- deterministic PRNG ----------
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const noise = (n, seed) => { const r = rng(seed), x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = r() * 2 - 1; return x; };
const mk = (n = N) => new Float64Array(n);

// ---------- DSP primitives ----------
export function biquad(x, type, fc, Q = 0.707, fs = SR) {
  const w = TAU * fc / fs, c = Math.cos(w), al = Math.sin(w) / (2 * Q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  const a0 = 1 + al, a1 = -2 * c / a0, a2 = (1 - al) / a0; b0 /= a0; b1 /= a0; b2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i]; const y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
  return x;
}
const normPeak = x => { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); if (m > 0) for (let i = 0; i < x.length; i++) x[i] /= m; return x; };
const endFade = (v, ms = 20) => { const r = Math.min(v.length, Math.round(ms / 1000 * SR)); for (let i = 0; i < r; i++) v[v.length - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / r); return v; };
const peakOf = x => { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } return m; };
// polyBLEP residual for a saw/pulse edge; t = phase 0..1, dt = phase increment
const blep = (t, dt) => t < dt ? (t /= dt, t + t - t * t - 1) : t > 1 - dt ? (t = (t - 1) / dt, t * t + t + t + 1) : 0;
// Chamberlin SVF sweep (fc <= 6 kHz at 48k): returns lp / bp
function svf(x, fcFn, damp, mode = 'lp') {
  let low = 0, band = 0; const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(6000, fcFn(i)) / SR);
    low += f * band; const high = x[i] - low - damp * band; band += f * high;
    out[i] = mode === 'bp' ? band : low;
  }
  return out;
}

// ---------- the engine ----------
export function createEngine(o) {
  const L = {};   // buses
  const bus = () => ({ L: mk(), R: mk(), rv: mk(), dl: mk() });
  const drums = bus(), stab = bus(), fx = bus();
  const kickM = mk();                         // kick, mono, kept apart so the rumble send and sidechain are exact
  const rumbleSend = mk(), drone = mk();
  const kicks = [];                           // [sample, depth] sidechain triggers (real kicks and phantoms)
  const acidEv = [];                          // acid note events
  const curves = {};                          // automation: name -> [[bar(1-based, fractional), value], ...]
  const R = { rumbleDrone: [] };
  const mutes = [];                           // hard cuts: [s0, s1, stemNames]
  const mute = (s0, s1, names) => mutes.push([s0, s1, names]);

  function put(st, s0, v, { pan = 0, rv = 0, dl = 0, gain = 1 } = {}) {
    const gl = Math.cos((pan + 1) * Math.PI / 4) * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * gain;
    const n = Math.min(v.length, N - s0);
    for (let i = 0; i < n; i++) { const x = v[i], j = s0 + i; st.L[j] += x * gl; st.R[j] += x * gr; if (rv) st.rv[j] += x * rv; if (dl) st.dl[j] += x * dl; }
  }
  const sp = (bar1, step = 0) => (bar1 - 1) * BAR + step * S16;     // sample of 1-based bar + 16th step
  const seedOf = (s0, k) => (o.seed * 7919 + s0 * 31 + k * 977) >>> 0;

  // ---- automation ----
  function setCurve(name, pts) { curves[name] = pts; }
  function curveArr(name, def, log) {
    const pts = curves[name] || [[1, def]], a = mk();
    let k = 0;
    for (let i = 0; i < N; i++) {
      const b = 1 + i / BAR;
      while (k < pts.length - 1 && b >= pts[k + 1][0]) k++;
      if (b <= pts[0][0] || k >= pts.length - 1) { a[i] = pts[Math.min(k, pts.length - 1)][1]; if (b <= pts[0][0]) a[i] = pts[0][1]; continue; }
      const [b0, v0] = pts[k], [b1, v1] = pts[k + 1], t = (b - b0) / (b1 - b0);
      a[i] = log ? v0 * Math.pow(v1 / v0, t) : v0 + (v1 - v0) * t;
    }
    return a;
  }

  // ---- ACID RIFF (A Phrygian, root A1 = midi 33). n = semitones above A1. l = 16ths. a = accent. sl = slide from prior note. ----
  const N_ = (s, n, l, a = 0, sl = 0) => ({ s, n, l, a, sl });
  const BAR_A = [N_(0, 0, 2, 1), N_(2, 0, 1), N_(3, 12, 1), N_(4, 0, 1, 1), N_(5, 0, 1), N_(6, 1, 2, 1), N_(8, 0, 2), N_(10, 3, 1, 0, 1), N_(11, 12, 1), N_(12, 0, 1), N_(13, -2, 1, 1), N_(14, 0, 2, 0, 1)];
  const BAR_B = [N_(0, 0, 2, 1), N_(2, 0, 1), N_(3, 12, 1), N_(4, 7, 1, 1), N_(5, 8, 1, 0, 1), N_(6, 7, 1, 0, 1), N_(7, 5, 1), N_(8, 1, 2, 1), N_(10, 0, 1), N_(11, 12, 1, 1), N_(12, 3, 1), N_(13, 1, 1, 0, 1), N_(14, 0, 2, 1, 1)];
  // variants: full | sparse (hook: accents + Bb only) | peak (16th climb at the end) | hard (more octave jumps, 16th chatter)
  function riffBar(which, variant) {
    let b = (which === 0 ? BAR_A : BAR_B).map(x => ({ ...x }));
    if (variant === 'sparse') b = b.filter(x => x.a || x.n === 1 || x.s === 0);
    if (variant === 'peak' && which === 1) b = b.filter(x => x.s < 12).concat([N_(12, 0, 1), N_(13, 1, 1, 0, 1), N_(14, 3, 1, 1, 1), N_(15, 13, 1, 1)]);
    if (variant === 'peak' && which === 0) b = b.concat([]).map(x => x.s === 12 ? { ...x, a: 1 } : x);
    if (variant === 'hard') {
      if (which === 0) { b = b.map(x => x.s === 6 ? { ...x, l: 1 } : x).concat([N_(7, 12, 1, 1)]); }
      else { b = b.map(x => x.s === 14 ? { ...x, l: 1 } : x).concat([N_(15, 13, 1, 1)]); b = b.filter(x => x.s !== 9); b.push(N_(9, 0, 1)); }
    }
    return b;
  }
  // place acid over bars [a,b); fromStep/toStep clip (absolute step inside range)
  function acid(a, b, { variant = 'full', fromStep = 0, toStep = 1e9 } = {}) {
    for (let bar = a; bar < b; bar++) {
      const which = (bar - 1) % 2;
      for (const n of riffBar(which, variant)) {
        const st = (bar - a) * 16 + n.s;
        if (st < fromStep || st >= toStep) continue;
        acidEv.push({ s0: sp(bar, n.s), len: n.l * S16, midi: 33 + n.n, acc: n.a, sl: n.sl, rel: 0.012 });
      }
    }
  }
  // a single held acid note (breakdown tail, last hit)
  function acidNote(s0, lenSamples, midi, { acc = 1, rel = 0.25 } = {}) { acidEv.push({ s0, len: lenSamples, midi, acc, sl: 0, rel }); }

  function renderAcid() {
    acidEv.sort((x, y) => x.s0 - y.s0);
    // truncate overlaps (mono) and decide gaps; slide notes tie to previous
    for (let i = 0; i < acidEv.length; i++) {
      const e = acidEv[i], nx = acidEv[i + 1];
      if (nx && e.s0 + e.len > nx.s0) e.len = nx.s0 - e.s0;
      const tied = nx && nx.sl && nx.s0 === e.s0 + e.len;
      e.gate = tied ? e.len : Math.max(1, e.len - Math.min(500, e.len >> 2));
      e.tied = tied;
    }
    const cutA = curveArr('cutoff', 500, true), resA = curveArr('res', 0.7, false), drvA = curveArr('drive', 2.2, false), lvlA = curveArr('level', 1, false);
    const OS = 2, fs = SR * OS, outA = mk(OS * N), outP = mk(OS * N);
    const tgt = mk(), gate = mk(), acc = mk(), slideF = mk(), relA = mk(); const trig = new Uint8Array(N);
    for (const e of acidEv) {
      const f = mtof(e.midi);
      for (let i = 0; i < e.len && e.s0 + i < N; i++) { const j = e.s0 + i; tgt[j] = f; acc[j] = e.acc; slideF[j] = e.sl ? 1 : 0; relA[j] = e.rel; if (i < e.gate) gate[j] = 1; }
      if (!e.sl && e.s0 < N) trig[e.s0] = e.acc ? 2 : 1;
    }
    let f = 55, env = 0, accS = 0, ph = 0, ph2 = 0, envTau = 0.2, depth = 2.2;
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0;   // ladder states and their tanh
    const kAcc = 1 - Math.exp(-1 / (0.004 * SR));
    const rawSig = mk(OS * N);
    for (let i = 0; i < N; i++) {
      if (tgt[i] > 0) {
        if (slideF[i]) f += (tgt[i] - f) * (1 - Math.exp(-1 / (0.030 * SR))); else f = tgt[i];
      }
      if (trig[i]) { env = 1; const a = trig[i] === 2; envTau = a ? 0.085 : 0.20; depth = a ? 3.3 : 2.2; }
      env *= Math.exp(-1 / (envTau * SR));
      accS += (acc[i] - accS) * kAcc;
      const keyf = Math.pow(f / 55, 0.35);
      const fc = Math.min(11000, cutA[i] * o.basscut * keyf * Math.pow(2, depth * env * (1 + 0.15 * accS)));
      const g = 1 - Math.exp(-TAU * fc / fs);
      const kres = Math.min(4.02, 4.0 * Math.min(1, resA[i] + 0.1 * accS));
      const dt = f / fs, drv = drvA[i] * (1 + 0.25 * accS);
      for (let u = 0; u < OS; u++) {
        ph += dt; if (ph >= 1) ph -= 1; ph2 += dt * 1.0045; if (ph2 >= 1) ph2 -= 1;
        const saw = 2 * ph - 1 - blep(ph, dt);
        const saw2 = 2 * ph2 - 1 - blep(ph2, dt * 1.0045);
        let sq = ph < 0.5 ? 1 : -1; sq += blep(ph, dt) - blep((ph + 0.5) % 1, dt);
        const osc = 0.75 * saw + 0.45 * saw2 + 0.3 * sq;
        rawSig[OS * i + u] = osc;
        // 4-pole ladder with tanh stages and resonance feedback; input drive, input comp for resonance loss
        const x = Math.tanh(drv * osc * (1 + 0.45 * kres) * 0.8 - kres * t4);
        s1 += g * (x - t1); t1 = Math.tanh(s1);
        s2 += g * (t1 - t2); t2 = Math.tanh(s2);
        s3 += g * (t2 - t3); t3 = Math.tanh(s3);
        s4 += g * (t3 - t4); t4 = Math.tanh(s4);
        outA[OS * i + u] = s4;
      }
    }
    // downsample 2x
    const decim = (x) => { biquad(x, 'lp', 20500, 0.6, fs); biquad(x, 'lp', 20500, 0.9, fs); const y = mk(); for (let i = 0; i < N; i++) y[i] = x[OS * i]; return y; };
    const lad = decim(outA);
    // parallel saturated layer: raw saw/square body, LP 750, hard tanh
    biquad(rawSig, 'lp', 750, 0.8, fs); biquad(rawSig, 'lp', 1100, 0.7, fs);
    const par = decim(rawSig);
    // amp env, sub
    const amp = mk(), ampSub = mk(), subOut = mk(), bassOut = mk();
    let a = 0, as = 0, sph = 0, sf = 40;
    const ka = 1 - Math.exp(-1 / (0.0009 * SR)), kas = 1 - Math.exp(-1 / (0.004 * SR));
    for (let i = 0; i < N; i++) {
      const gt = gate[i];
      a += (gt - a) * (gt ? ka : 1 - Math.exp(-1 / ((relA[i] || 0.012) * SR)));
      as += (gt - as) * (gt ? kas : 1 - Math.exp(-1 / (Math.max(0.03, relA[i] || 0.03) * SR)));
      if (tgt[i] > 0) { const h = tgt[i] / 2; sf += ((h >= 36 ? h : tgt[i]) - sf) * (slideF[i] ? 1 - Math.exp(-1 / (0.03 * SR)) : 1); }
      sph += TAU * sf / SR; if (sph > TAU) sph -= TAU;
      const acs = 1 + 0.28 * Math.min(1, acc[i]);
      amp[i] = a * acs * lvlA[i]; ampSub[i] = as * lvlA[i];
      const post = Math.tanh(1.35 * lad[i] * 1.9);
      const parl = Math.tanh(4 * par[i]) * 0.26;
      bassOut[i] = (post * 0.62 + parl) * amp[i];
      subOut[i] = Math.tanh(1.5 * Math.sin(sph)) * ampSub[i] * 0.62;
    }
    biquad(subOut, 'lp', 130, 0.7); biquad(subOut, 'hp', 24, 0.7);
    biquad(bassOut, 'hp', 32, 0.7);
    return { bass: bassOut, sub: subOut };
  }

  // ---- DRUMS ----
  function kick(s0, vel = 1, { rumble = 1, depth = 0.62, tune = 1 } = {}) {
    const n = Math.round(0.45 * SR), v = new Float64Array(n), cl = noise(Math.round(0.02 * SR), seedOf(s0, 1)); let ph = 0;
    biquad(cl, 'hp', 1800, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 55 * tune + 150 * Math.exp(-t / 0.022) + 40 * Math.exp(-t / 0.006);
      ph += TAU * f / SR;
      let x = Math.sin(ph) * Math.exp(-t / 0.19) * (1 - Math.exp(-t / 0.0012));
      x = Math.tanh(1.8 * x) * 0.8;
      if (i < cl.length) x += cl[i] * Math.exp(-t / 0.002) * 0.35;
      v[i] = x;
    }
    endFade(v, 20);
    for (let i = 0; i < n && s0 + i < N; i++) { kickM[s0 + i] += v[i] * vel; rumbleSend[s0 + i] += v[i] * vel * rumble; }
    kicks.push([s0, depth * Math.min(1, vel)]);
  }
  const phantomDuck = (s0, depth) => kicks.push([s0, depth]);
  function clap(s0, vel = 1) {
    const n = Math.round(0.34 * SR), x = noise(n, seedOf(s0, 2));
    biquad(x, 'hp', 500, 0.7); biquad(x, 'lp', 2400, 0.6); normPeak(x);
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR; let e = 0;
      for (const of of [0, 0.010, 0.021]) if (t >= of) e += Math.exp(-(t - of) / 0.004) * 0.7;
      if (t >= 0.031) e += Math.exp(-(t - 0.031) / 0.085);
      v[i] = x[i] * e * 0.3 * (1 - Math.exp(-t / 0.0008));
    }
    endFade(v, 15); put(drums, s0, v, { gain: vel, rv: 0.55, pan: 0.04 });
  }
  const HAT_F = [3290, 4470, 5810, 7290, 8430, 9790];
  function hat(s0, vel, open) {
    const n = Math.round((open ? 0.34 : 0.09) * SR), x = noise(n, seedOf(s0, 3)), v = new Float64Array(n);
    biquad(x, 'hp', 6800, 0.7); biquad(x, 'lp', 12000, 0.7); normPeak(x);
    const tau = open ? 0.085 : 0.014;
    for (let i = 0; i < n; i++) {
      const t = i / SR; let m = 0; for (let k = 0; k < 6; k++) m += Math.sin(TAU * HAT_F[k] * t + k);
      v[i] = (x[i] * 0.75 + m * 0.06) * Math.exp(-t / tau) * (1 - Math.exp(-t / 0.0006)) * 0.1;
    }
    endFade(v, 10); put(drums, s0, v, { gain: vel, pan: open ? 0.25 : -0.12, rv: open ? 0.12 : 0.03 });
  }
  // standard groove over bars [a,b): kick on beats, clap on 2/4, offbeat open hat, 16th closed hats
  function groove(a, b, { kickOn = true, kickVel = 1, clapOn = true, openHat = 1, hat16 = 0.28, hatSkip = 0, kickFill = false, fromStep = 0 } = {}) {
    for (let bar = a; bar < b; bar++) for (let s = 0; s < 16; s++) {
      if ((bar - a) * 16 + s < fromStep) continue;
      const s0 = sp(bar, s);
      if (kickOn && s % 4 === 0) kick(s0, kickVel * (s === 0 ? 1.05 : 1));
      if (kickFill && bar === b - 1 && s >= 12 && s % 2 === 0 && s !== 12) kick(s0, 0.7);
      if (clapOn && (s === 4 || s === 12)) clap(s0, 1);
      if (openHat && s % 4 === 2) hat(s0, openHat, true);
      else if (hat16 && s % 4 !== 0 && !(hatSkip && s % 4 === 2)) hat(s0, hat16 * (s % 2 ? 0.7 : 1), false);
      else if (hat16 && s % 4 === 0) hat(s0, hat16 * 0.5, false);
    }
  }

  // ---- RUMBLE DRONE (bars without kick) ----
  function droneBars(a, b, level = 1, fadeIn = 0.4, fadeOut = 0.3) {
    R.rumbleDrone.push([sp(a), sp(b), level, fadeIn * BAR, fadeOut * BAR]);
  }
  function renderDrone() {
    for (const [s0, s1, lv, fi, fo] of R.rumbleDrone) {
      const n = Math.min(N, s1) - s0, nz = noise(n, seedOf(s0, 9)); let p = 0, p2 = 0, lp = 0, lp2 = 0;
      const out = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        p += 55 / SR; if (p >= 1) p -= 1; p2 += 55.12 / SR; if (p2 >= 1) p2 -= 1;
        const sw = (2 * p - 1) + (2 * p2 - 1);
        lp += 0.0095 * (sw - lp); lp2 += 0.0095 * (lp - lp2);               // ~75 Hz
        const lfo = 0.65 + 0.35 * Math.sin(TAU * (i / BEAT) * 0.25 + 0.7);      // breathes every 4 beats
        out[i] = Math.tanh(2.2 * lp2) * 0.5 * lfo;
        const e = Math.min(1, i / fi, (n - i) / fo);
        out[i] *= e * lv; out[i] += nz[i] * 0.0;
      }
      // dark noise bed
      const bed = biquad(biquad(nz.slice(), 'lp', 220, 0.7), 'lp', 220, 0.7);
      for (let i = 0; i < n; i++) { const e = Math.min(1, i / fi, (n - i) / fo); drone[s0 + i] += out[i] + bed[i] * 0.7 * e * lv; }
    }
  }

  // ---- STAB (Am / Bb), filtered, sent to the dub delay ----
  const CHORDS = { Am: [57, 60, 64, 69], Bb: [58, 62, 65, 70], AmHi: [69, 72, 76, 81], BbHi: [70, 74, 77, 82] };
  function stabHit(s0, chord = 'Am', vel = 1) {
    const midis = CHORDS[chord], n = Math.round(0.6 * SR), v = new Float64Array(n);
    for (const m of midis) for (const det of [-0.0035, 0.0035]) {
      const f = mtof(m) * (1 + det), dt = f / SR; let p = (m * 0.137 + det * 100) % 1;
      for (let i = 0; i < n; i++) { p += dt; if (p >= 1) p -= 1; v[i] += 2 * p - 1 - blep(p, dt); }
    }
    const f0 = svf(v, i => 380 + 2300 * Math.exp(-i / SR / 0.11), 0.55, 'lp');
    for (let i = 0; i < n; i++) { const t = i / SR; f0[i] = Math.tanh(f0[i] * 0.35) * Math.exp(-t / 0.22) * (1 - Math.exp(-t / 0.002)) * 0.5; }
    biquad(f0, 'hp', 140, 0.7); endFade(f0, 30);
    put(stab, s0, f0, { gain: vel, rv: 0.25, dl: 0.7 });
  }

  // ---- FX ----
  function thump(st, s0, f0, f1, sw, tau, amp, lenS, opt = {}) {
    const n = Math.round(lenS * SR), v = new Float64Array(n); let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t / sw); ph += TAU * f / SR;
      v[i] = Math.tanh(1.4 * Math.sin(ph)) * Math.exp(-t / tau) * (1 - Math.exp(-t / 0.0015)) * amp;
    }
    endFade(v, 12); put(st, s0, v, opt);
  }
  // impact: sub drop landing on A1 + noise sweeping down; size scales level and length
  function impact(s0, size = 1) {
    const len = Math.round((1.2 + 1.0 * size) * SR), n = Math.min(len, N - s0), sub = new Float64Array(n); let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 55 + 95 * Math.exp(-t / 0.28) + 25 * Math.exp(-t / 0.05);
      ph += TAU * f / SR;
      sub[i] = Math.tanh(1.3 * Math.sin(ph)) * Math.exp(-t / (0.5 + 0.5 * size)) * (1 - Math.exp(-t / 0.002)) * 0.9 * size;
    }
    put(fx, s0, endFade(sub, 40), { gain: 1 });
    const nz = noise(n, seedOf(s0, 4)), nf = svf(nz, i => 240 + 5200 * Math.exp(-i / SR / 0.30), 0.9, 'lp');
    for (let i = 0; i < n; i++) { const t = i / SR; nf[i] *= Math.exp(-t / (0.35 + 0.25 * size)) * (1 - Math.exp(-t / 0.0015)) * 0.55 * size; }
    put(fx, s0, endFade(nf, 40), { rv: 0.6, pan: 0 });
  }
  // reverse riser: swelling band-passed noise + glide sine into A, ends at s1 (the drop)
  function riser(s0, s1, amp = 1, fc0 = 260, fc1 = 5200) {
    const n = s1 - s0, nz = noise(n, seedOf(s0, 5));
    const bp = svf(nz, i => fc0 * Math.pow(fc1 / fc0, i / n), 0.55, 'bp'); normPeak(bp);
    let ph = 0; const v = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const r = i / n, e = Math.pow(r, 2.4) * (1 - Math.exp(-i / (0.03 * SR))), f = 110 * Math.pow(4, r);   // A2 -> A4
      ph += TAU * f / SR;
      v[i] = (bp[i] * 0.42 + Math.sin(ph) * 0.07 + Math.sin(ph * 1.5) * 0.03) * e * amp;
    }
    const fo = Math.min(n, 96); for (let i = 0; i < fo; i++) v[n - 1 - i] *= i / fo;
    put(fx, s0, v, { rv: 0.35, pan: 0 });
  }
  // soft low tick for a typed letter, tone from the Phrygian set (low octave)
  const PHRYG = [0, 1, 3, 5, 7, 8, 10];
  function tick(s0, idx, vel = 1) {
    const m = 45 + 12 * Math.floor(idx / 7 % 2) + PHRYG[[0, 2, 4, 2, 3, 5, 4, 1][idx % 8]];
    const f = mtof(m), n = Math.round(0.12 * SR), v = new Float64Array(n), cl = noise(Math.round(0.004 * SR), seedOf(s0, 6));
    biquad(cl, 'lp', 2500, 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      v[i] = (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2 * t)) * Math.exp(-t / 0.032) * (1 - Math.exp(-t / 0.0008)) * 0.1
        + (i < cl.length ? cl[i] * Math.exp(-t / 0.0012) * 0.05 : 0);
    }
    endFade(v, 8); put(fx, s0, v, { gain: vel, pan: (idx % 2 ? 0.25 : -0.25), rv: 0.35 });
  }
  function typing(text, n0, vel = 1) { for (let i = 0; i < text.length; i++) tick(s16Sample(n0 + i), i, vel); }
  // stamp hit: dull thud + short metallic clack, A-tuned
  function stampHit(s0, size = 1) {
    thump(fx, s0, 150, 55, 0.03, 0.12, 0.55 * size, 0.5, { rv: 0.3 });
    const nz = noise(Math.round(0.08 * SR), seedOf(s0, 7)); biquad(nz, 'hp', 900, 0.8); biquad(nz, 'lp', 4200, 0.7);
    for (let i = 0; i < nz.length; i++) nz[i] *= Math.exp(-i / SR / 0.012) * 0.28 * size * (1 - Math.exp(-i / SR / 0.0005));
    put(fx, s0, endFade(nz, 6), { rv: 0.4 });
  }
  // copy hit: thud, tick, soft in-key ding (A3 + E4)
  function copyHit(s0, size = 1) {
    thump(fx, s0, 170, 58, 0.025, 0.09, 0.5 * size, 0.4, { rv: 0.25 });
    for (const [m, a] of [[57, 0.09], [64, 0.07], [69, 0.04]]) {
      const f = mtof(m), n = Math.round(0.6 * SR), v = new Float64Array(n);
      for (let i = 0; i < n; i++) { const t = i / SR; v[i] = Math.sin(TAU * f * t) * Math.exp(-t / 0.18) * (1 - Math.exp(-t / 0.002)) * a * size; }
      put(fx, s0, endFade(v, 30), { rv: 0.4, dl: 0.3 });
    }
  }
  // noise crash for "flash" accents
  function flash(s0, amp = 1) {
    const n = Math.round(0.45 * SR), x = noise(n, seedOf(s0, 8)); biquad(x, 'hp', 2800, 0.7); biquad(x, 'lp', 10000, 0.7);
    for (let i = 0; i < n; i++) x[i] *= Math.exp(-i / SR / 0.11) * (1 - Math.exp(-i / SR / 0.001)) * 0.12 * amp;
    put(fx, s0, endFade(x, 20), { rv: 0.5, pan: 0.05 });
  }

  // ---- buses: sidechain, reverb, delay ----
  function sidechainArr() {
    const d = mk(); kicks.sort((a, b) => a[0] - b[0]);
    for (const [s0, depth] of kicks) { const n = Math.min(Math.round(0.5 * SR), N - s0); for (let i = 0; i < n; i++) { const v = depth * Math.exp(-i / SR / 0.115); if (v > d[s0 + i]) d[s0 + i] = v; } }
    return d;
  }
  function reverb(x, { rt = 1.1, damp = 0.45, pre = 0.012, hp = 220, lp = 5500, level = 1 } = {}) {
    const out = { L: mk(), R: mk() };
    if (peakOf(x) < 1e-9) return out;
    const xin = Float64Array.from(x); biquad(xin, 'hp', hp, 0.7); biquad(xin, 'lp', lp, 0.7);
    const p = Math.round(pre * SR);
    const chan = (lens) => {
      const y = mk();
      for (const Ln of lens) {
        const buf = mk(Ln), g = Math.pow(10, -3 * Ln / (rt * SR)); let idx = 0, lps = 0;
        for (let i = p; i < N; i++) { const b = buf[idx]; lps = b * (1 - damp) + lps * damp; buf[idx] = xin[i - p] + g * lps; if (++idx === Ln) idx = 0; y[i] += b * 0.2; }
      }
      for (const [Ln, ag] of [[556, 0.5], [441, 0.5]]) { const buf = mk(Ln); let idx = 0; for (let i = 0; i < N; i++) { const b = buf[idx], v = y[i] - ag * b; buf[idx] = v; y[i] = b + ag * v; if (++idx === Ln) idx = 0; } }
      return y;
    };
    const wl = chan([1423, 1559, 1693, 1811, 1931, 2053]), wr = chan([1459, 1597, 1733, 1861, 1979, 2111]);
    for (let i = 0; i < N; i++) { out.L[i] = wl[i] * level; out.R[i] = wr[i] * level; }
    return out;
  }
  function dubDelay(x, fb = 0.48) {           // dotted 8th (L) and a beat (R) = in time with the grid
    const out = { L: mk(), R: mk() };
    if (peakOf(x) < 1e-9) return out;
    for (const [ch, D] of [['L', 3 * S16], ['R', 4 * S16]]) {
      const y = out[ch]; let lp = 0, hp = 0; const k = 1 - Math.exp(-TAU * 1900 / SR);
      for (let i = D; i < N; i++) {
        const inp = x[i - D] + fb * y[i - D]; lp += k * (inp - lp); hp += 0.02 * (lp - hp); y[i] = lp - hp;
      }
    }
    return out;
  }

  // ---- render everything to stems ----
  function render() {
    const { bass, sub } = renderAcid();
    renderDrone();
    const duck = sidechainArr();
    const dk = (a, kdepth) => { for (let i = 0; i < N; i++) a[i] *= 1 - Math.min(0.97, duck[i] * kdepth); return a; };
    const rumbleRaw = Float64Array.from(rumbleSend);
    // rumble: kick through a long, dark reverb, ducked hard, mono, plus drone
    biquad(rumbleRaw, 'lp', 160, 0.7);
    const rr = reverb(rumbleRaw, { rt: 1.5, damp: 0.7, pre: 0.02, hp: 30, lp: 150, level: 5.5 });
    const rum = mk(); for (let i = 0; i < N; i++) rum[i] = (rr.L[i] + rr.R[i]) * 0.5;
    for (let i = 0; i < N; i++) rum[i] = Math.tanh(1.5 * rum[i]) * 0.6;
    biquad(rum, 'lp', 160, 0.7); biquad(rum, 'hp', 28, 0.7);
    dk(rum, 1.25);
    const dr = mk(); for (let i = 0; i < N; i++) dr[i] = drone[i]; dk(dr, 0.7);
    for (let i = 0; i < N; i++) rum[i] += dr[i];
    // bass stem: mono low, slightly widened highs
    dk(bass, 1); dk(sub, 1);
    const bassHi = Float64Array.from(bass); biquad(bassHi, 'hp', 300, 0.7); const wd = 19;
    const bs = { L: mk(), R: mk() };
    for (let i = 0; i < N; i++) { const lo = bass[i] - bassHi[i] + sub[i]; bs.L[i] = lo + bassHi[i]; bs.R[i] = lo + (i >= wd ? bassHi[i - wd] : 0); }
    // stab: duck, then delay + reverb
    for (let i = 0; i < N; i++) { const g = 1 - Math.min(0.97, duck[i] * 0.8); stab.L[i] *= g; stab.R[i] *= g; }
    const sD = dubDelay(stab.dl), sR = reverb(stab.rv, { rt: 1.0, level: 0.9 });
    for (let i = 0; i < N; i++) { stab.L[i] += sD.L[i] * 0.75 + sR.L[i]; stab.R[i] += sD.R[i] * 0.75 + sR.R[i]; }
    // drums
    for (let i = 0; i < N; i++) { drums.L[i] += kickM[i]; drums.R[i] += kickM[i]; }
    const dRv = reverb(drums.rv, { rt: 0.9, damp: 0.55, lp: 4500, level: 1 });
    for (let i = 0; i < N; i++) { drums.L[i] += dRv.L[i]; drums.R[i] += dRv.R[i]; }
    // fx
    const fR = reverb(fx.rv, { rt: 1.3, lp: 5000, level: 1 }), fD = dubDelay(fx.dl, 0.4);
    for (let i = 0; i < N; i++) { fx.L[i] += fR.L[i] + fD.L[i] * 0.6; fx.R[i] += fR.R[i] + fD.R[i] * 0.6; }
    const stems = {
      bass: { L: bs.L, R: bs.R, g: db2(o.bass) * 0.7 },
      rumble: { L: rum, R: rum, g: db2(o.rumble) * 1.0 },
      drums: { L: drums.L, R: drums.R, g: db2(o.drums) * 2.3 },
      stab: { L: stab.L, R: stab.R, g: db2(o.stab) * 1.8 },
      fx: { L: fx.L, R: fx.R, g: db2(o.fx) * 1.6 },
    };
    for (const [m0, m1, names] of mutes) for (const k of names) {
      const st = stems[k], r = 384;                                     // 8 ms ramps, no clicks
      for (let i = m0; i < Math.min(N, m1); i++) {           // down-ramp, then silent until m1 (m1 = next downbeat, sources start there)
        const g = i < m0 + r ? 0.5 + 0.5 * Math.cos(Math.PI * (i - m0) / r) : 0;
        st.L[i] *= g; st.R[i] *= g;
      }
    }
    return stems;
  }

  return { mute, o, N, sp, setCurve, acid, acidNote, kick, phantomDuck, clap, hat, groove, droneBars, stabHit, thump, impact, riser, tick, typing, stampHit, copyHit, flash, render, kicks, kickM };
}

// ---------- mastering and verification ----------
function kWeight(x) {
  const f = (x, b, a) => { const y = mk(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i]; const o = b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; } return y; };
  return f(f(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
}
export function lufs(L, R) {           // ITU-R BS.1770-4 integrated, gated
  const zl = kWeight(L), zr = kWeight(R), blk = 19200, hop = 4800, ms = [];
  for (let s = 0; s + blk <= L.length; s += hop) { let a = 0, b = 0; for (let i = s; i < s + blk; i++) { a += zl[i] * zl[i]; b += zr[i] * zr[i]; } ms.push((a + b) / blk); }
  const l = v => -0.691 + 10 * Math.log10(v), g1 = ms.filter(v => l(v) > -70);
  const r = l(g1.reduce((a, b) => a + b, 0) / g1.length) - 10, g2 = g1.filter(v => l(v) > r);
  return l(g2.reduce((a, b) => a + b, 0) / g2.length);
}
function truePeak(x) {                 // 4x windowed-sinc oversampled peak (linear)
  let best = peakOf(x); const T = 12, ph = [0.25, 0.5, 0.75];
  const taps = ph.map(p => { const h = new Float64Array(2 * T); for (let k = 0; k < 2 * T; k++) { const d = k - (T - 1) - p; const s = Math.abs(d) < 1e-9 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d); h[k] = s * (0.5 + 0.5 * Math.cos(Math.PI * d / T)); } return h; });
  const thr = best * 0.7;
  for (let i = T; i < x.length - T; i++) {
    if (Math.abs(x[i]) < thr && Math.abs(x[i + 1]) < thr) continue;
    for (const h of taps) { let a = 0; for (let k = 0; k < 2 * T; k++) a += x[i - (T - 1) + k] * h[k]; if (Math.abs(a) > best) best = Math.abs(a); }
  }
  return best;
}
const softclip = x => { const k = 0.62, a = Math.abs(x); return a <= k ? x : Math.sign(x) * (k + (1 - k) * Math.tanh((a - k) / (1 - k))); };
function limiter(L, R, ceil) {
  const Lk = 120, g = mk(N);
  for (let i = 0; i < N; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); g[i] = a > ceil ? ceil / a : 1; }
  const m = mk(N), dq = new Int32Array(N); let h = 0, t = 0;
  for (let i = 0; i < N + Lk; i++) {
    if (i < N) { while (t > h && g[dq[t - 1]] >= g[i]) t--; dq[t++] = i; }
    const c = i - Lk; if (c >= 0) { while (dq[h] < c - Lk) h++; m[c] = g[dq[h]]; }
  }
  const pre = mk(N + 1); for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + m[i];
  const rel = 1 - Math.exp(-1 / (0.07 * SR)); let e = 1;
  for (let i = 0; i < N; i++) {
    const lo = Math.max(0, i - Lk), hi = Math.min(N - 1, i + Lk), gs = (pre[hi + 1] - pre[lo]) / (hi - lo + 1);
    e = gs < e ? gs : e + rel * (gs - e); L[i] *= e; R[i] *= e;
  }
}
function writeWav(file, L, R) {
  const buf = Buffer.alloc(44 + N * 6); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
  let p = 44; const q = x => Math.max(-8388608, Math.min(8388607, Math.round(x * 8388607)));
  for (let i = 0; i < N; i++) { buf.writeIntLE(q(L[i]), p, 3); buf.writeIntLE(q(R[i]), p + 3, 3); p += 6; }
  fs.writeFileSync(file, buf);
}
const dB = v => (20 * Math.log10(Math.max(v, 1e-12))).toFixed(1);

// master the stems, write audio.wav + stems/*.wav, print verification
export function finish(e, outDir) {
  const o = e.o, stems = e.render();
  const mixL = mk(), mixR = mk();
  for (const k in stems) {
    const s = stems[k];
    for (let i = 0; i < N; i++) { if (!Number.isFinite(s.L[i]) || !Number.isFinite(s.R[i])) throw new Error('non-finite sample in stem ' + k + ' at ' + i); mixL[i] += s.L[i] * s.g; mixR[i] += s.R[i] * s.g; }
  }
  // bus: subsonic high-pass, mono below 120 Hz (side high-passed)
  biquad(mixL, 'hp', 28, 0.7); biquad(mixR, 'hp', 28, 0.7);
  { const M = mk(), S = mk(); for (let i = 0; i < N; i++) { M[i] = (mixL[i] + mixR[i]) / 2; S[i] = (mixL[i] - mixR[i]) / 2; }
    biquad(S, 'hp', 120, 0.7); for (let i = 0; i < N; i++) { mixL[i] = M[i] + S[i]; mixR[i] = M[i] - S[i]; } }
  const fade = mk(); fade.fill(1);
  const fi = 96; for (let i = 0; i < fi; i++) fade[i] = 0.5 - 0.5 * Math.cos(Math.PI * i / fi);    // start guard
  const fo = 14400; for (let i = 0; i < fo; i++) fade[N - 1 - i] = Math.min(fade[N - 1 - i], 0.5 - 0.5 * Math.cos(Math.PI * i / fo));  // end guard (0.3 s), last sample = 0
  let ceil = db2(o.tp - 0.15);
  const master = gain => {
    const L = mk(), R = mk();
    for (let i = 0; i < N; i++) { L[i] = softclip(mixL[i] * gain); R[i] = softclip(mixR[i] * gain); }
    limiter(L, R, ceil);
    for (let i = 0; i < N; i++) { L[i] *= fade[i]; R[i] *= fade[i]; }
    return [L, R];
  };
  let gain = db2(o.lufs - lufs(mixL, mixR)), outL, outR;
  for (let it = 0; it < 8; it++) {
    [outL, outR] = master(gain);
    const l = lufs(outL, outR), tp = Math.max(truePeak(outL), truePeak(outR));
    if (tp > db2(o.tp)) ceil *= db2(o.tp) / tp * 0.998;      // pull the limiter ceiling down until true peak complies
    else if (Math.abs(l - o.lufs) < 0.08) break;
    if (Math.abs(l - o.lufs) >= 0.08) gain *= db2(o.lufs - l);
  }
  const lf = lufs(outL, outR), tpk = Math.max(truePeak(outL), truePeak(outR));
  fs.mkdirSync(path.join(outDir, 'stems'), { recursive: true });
  writeWav(path.join(outDir, 'audio.wav'), outL, outR);
  console.log(`master: LUFS ${lf.toFixed(2)} (target ${o.lufs}), true peak ${dB(tpk)} dBTP, sample peak ${dB(Math.max(peakOf(outL), peakOf(outR)))} dBFS, samples ${outL.length}`);
  const mono = {};
  for (const k in stems) {
    const s = stems[k], L = mk(), R = mk();
    for (let i = 0; i < N; i++) { L[i] = s.L[i] * s.g * gain * fade[i] * 0.5; R[i] = s.R[i] * s.g * gain * fade[i] * 0.5; }
    writeWav(path.join(outDir, 'stems', k + '.wav'), L, R);
    let ss = 0; for (let i = 0; i < N; i++) ss += L[i] * L[i] + R[i] * R[i];
    mono[k] = L;
    console.log(`stem ${k.padEnd(7)} peak ${dB(Math.max(peakOf(L), peakOf(R)))} dBFS  rms ${(10 * Math.log10(ss / (2 * N) + 1e-20)).toFixed(1)} dBFS (stems written at -6 dB, pre-limiter)`);
  }
  // click guard
  const maxStep = (x, a, b) => { let m = 0; for (let i = a + 1; i < b; i++) m = Math.max(m, Math.abs(x[i] - x[i - 1])); return m; };
  console.log(`start: first sample ${outL[0].toExponential(1)}, max step in first 256 ${maxStep(outL, 0, 256).toExponential(2)}; end: last sample ${outL[N - 1]}, max step in last 256 ${maxStep(outL, N - 256, N).toExponential(2)}`);
  { let a = 0; for (let i = N - 24000; i < N - 14400; i++) a = Math.max(a, Math.abs(outL[i])); console.log(`tail level just before end-guard: ${dB(a)} dBFS`); }
  // blind kick onset check on the kick-only signal: first rising edge of each hit, deviation from nearest 20800 multiple
  { const ons = onsetsVsGrid(e.kickM); const devs = ons.map(x => x.dev);
    ons.filter(x => Math.abs(((x.at + 2600) % 5200) - 2600) > 8).forEach(x => console.log("  off-grid onset at", x.at, "step", x.at / 5200));
    const on16 = ons.map(x => ((x.at + 2600) % 5200) - 2600), onB = ons.filter(x => Math.abs(x.dev) <= 64).length;
    console.log(`kick onsets detected blindly: ${ons.length} (${onB} on beat multiples of 20800, rest are 16th-grid fills); max |deviation from nearest 5200 multiple| ${Math.max(...on16.map(Math.abs))} samples; max |dev from nearest 20800 for beat kicks| ${Math.max(...ons.filter(x => Math.abs(x.dev) <= 64).map(x => Math.abs(x.dev)))}`); }
  return { stems, outL, outR, mono };
}

// onset-vs-grid measurement on a rendered wav-like mono array (blind): returns [{at, dev}]
export function onsetsVsGrid(x, period = BEAT) {
  const n = x.length, c = mk(n + 1); for (let i = 0; i < n; i++) c[i + 1] = c[i] + x[i] * x[i];
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(x[i]));
  const res = []; let last = -1e9;
  for (let i = 400; i < n - 64; i++) {
    const nx = c[i + 48] - c[i], pv = (c[i] - c[i - 400]) / 400 * 48 + 1e-12;
    if (nx > (0.15 * pk) ** 2 * 48 * 0.05 && nx > 6 * pv && i - last > 8000) { const d = j => Math.abs(x[j] - x[j - 1]); let m = 0; for (let j = Math.max(1, i - 1200); j < i + 96; j++) m = Math.max(m, d(j));
      let at = i; for (let j = Math.max(1, i - 1200); j < i + 96; j++) if (d(j) > 0.2 * m) { at = j; break; }
      res.push({ at, dev: ((at + period / 2) % period) - period / 2 }); last = i; }
  }
  return res;
}
