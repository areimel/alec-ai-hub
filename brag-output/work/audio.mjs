// AI Hub launch soundtrack. 48kHz stereo, 120 BPM, D major. All timing from timeline.js + integer sample math.
import { SYNC, BPM, DURATION, SCENES } from './timeline.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORK = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000, N = DURATION * SR;               // 960000
const BEAT = SR * 60 / BPM;                         // 24000 (integer)
const S16 = BEAT / 4, BAR = BEAT * 4;
if (!Number.isInteger(BEAT) || N !== 960000) throw new Error('grid');
const bt = sec => Math.round(sec * BPM / 60 * BEAT); // seconds -> sample via beat number
const TAU = Math.PI * 2;

// ---------- options ----------
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? parseFloat(args[i + 1]) : d; };
const db2 = d => Math.pow(10, d / 20);
const G_FX = db2(opt('fxgain', 0)), G_DR = db2(opt('drumgain', 0)), G_MU = db2(opt('musicgain', 0));
const TARGET = opt('lufs', -14), CEIL = db2(opt('ceiling', -1.6));

// ---------- PRNG ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = rng(20240607);
const noise = n => { const x = new Float64Array(n); for (let i = 0; i < n; i++) x[i] = rand() * 2 - 1; return x; };

// ---------- helpers ----------
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const mkStem = () => ({ L: new Float64Array(N), R: new Float64Array(N), rv: new Float64Array(N), dl: new Float64Array(N) });
function biquad(type, fc, Q = 0.707) {
  const w = TAU * fc / SR, c = Math.cos(w), al = Math.sin(w) / (2 * Q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  const a0 = 1 + al, a1 = -2 * c / a0, a2 = (1 - al) / a0; b0 /= a0; b1 /= a0; b2 /= a0;
  return x => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i]; const y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; } return x; };
}
const normPeak = x => { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); if (m > 0) for (let i = 0; i < x.length; i++) x[i] /= m; return x; };
function put(st, s0, v, { pan = 0, rv = 0, dl = 0, gain = 1 } = {}) {
  const gl = Math.cos((pan + 1) * Math.PI / 4) * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * gain;
  const n = Math.min(v.length, N - s0);
  for (let i = 0; i < n; i++) { const x = v[i], j = s0 + i; st.L[j] += x * gl; st.R[j] += x * gr; if (rv) st.rv[j] += x * rv; if (dl) st.dl[j] += x * dl; }
}
const endFade = (v, ms = 20) => { const r = Math.min(v.length, Math.round(ms / 1000 * SR)); for (let i = 0; i < r; i++) v[v.length - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / r); return v; };

// ---------- voices ----------
// Additive (band-limited, alias-free) pluck with brightness (fc) lowpass shape.
function pluck(st, s0, midi, o = {}) {
  const { dur = 0.5, amp = 1, fc = 2000, tau = 0.2, att = 0.006, hmax = 3000, tilt = 1.2, hdecay = 0.35, pan = 0, rv = 0, dl = 0 } = o;
  const f = mtof(midi), n = Math.round(dur * SR), v = new Float64Array(n);
  const hs = []; let e2 = 0;
  for (let h = 1; h <= 16 && h * f <= hmax; h++) { const a = Math.pow(h, -tilt) / Math.sqrt(1 + Math.pow(h * f / fc, 4)); hs.push([h, a]); e2 += a * a; }
  const sc = amp / Math.sqrt(e2);
  for (const [h, a] of hs) {
    const w = TAU * f * h / SR, dec = Math.exp(-1 / (SR * tau / (1 + hdecay * (h - 1)))); let env = a * sc;
    for (let i = 0; i < n; i++) { v[i] += Math.sin(w * i) * env; env *= dec; }
  }
  const ka = Math.exp(-1 / (att * SR)); let g = 1;
  for (let i = 0; i < n; i++) { v[i] *= 1 - g; g *= ka; }
  endFade(v, 25); put(st, s0, v, { pan, rv, dl });
}
function bassNote(st, s0, midi, durS, amp, tauF = 0.5) {
  const f = mtof(midi), n = Math.round(durS * SR), v = new Float64Array(n);
  [[1, 1], [2, 0.42], [3, 0.2], [4, 0.08]].forEach(([h, a]) => {
    const w = TAU * f * h / SR, dec = Math.exp(-1 / (SR * tauF / (1 + (h - 1) * 1.2))); let env = a * amp;
    for (let i = 0; i < n; i++) { v[i] += Math.sin(w * i) * env; env *= dec; }
  });
  const ka = Math.exp(-1 / (0.008 * SR)); let g = 1; for (let i = 0; i < n; i++) { v[i] *= 1 - g; g *= ka; }
  endFade(v, 30); put(st, s0, v, { gain: 1 });
}
function padVoice(st, s0, midi, durS, amp, att, rel, decayTau = 0, rv = 0.12) {
  const n = Math.round(durS * SR), v = new Float64Array(n), f = mtof(midi);
  for (const [det, a] of [[-5, 1], [5, 1], [0, 0.6]]) {
    const w = TAU * f * Math.pow(2, det / 1200) / SR;
    for (let i = 0; i < n; i++) v[i] += (Math.sin(w * i) + 0.25 * Math.sin(2 * w * i)) * a;
  }
  const na = Math.round(att * SR), nr = Math.round(rel * SR);
  for (let i = 0; i < n; i++) {
    let e = i < na ? 0.5 - 0.5 * Math.cos(Math.PI * i / na) : 1;
    if (decayTau) e *= Math.exp(-i / (SR * decayTau));
    const k = n - 1 - i; if (k < nr) e *= 0.5 - 0.5 * Math.cos(Math.PI * k / nr);
    v[i] *= e * amp / 2.6;
  }
  put(st, s0, v, { rv });
}
function thump(st, s0, f0, f1, sweepTau, tau, amp, lenS, o = {}) {
  const n = Math.round(lenS * SR), v = new Float64Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t / sweepTau); ph += TAU * f / SR;
    v[i] = Math.sin(ph) * Math.exp(-t / tau) * (1 - Math.exp(-t / 0.0012)) * amp;
  }
  endFade(v, 10); put(st, s0, v, o);
}
const kicks = [];
function kick(st, s0, vel) {
  const n = Math.round(0.5 * SR), v = new Float64Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 48 + 85 * Math.exp(-t / 0.028); ph += TAU * f / SR;
    v[i] = Math.tanh(1.25 * Math.sin(ph) * Math.exp(-t / 0.17) * (1 - Math.exp(-t / 0.0015))) * 0.8;
  }
  endFade(v, 20); put(st, s0, v, { gain: vel }); kicks.push([s0, vel]);
}
function clap(st, s0, vel) {
  const n = Math.round(0.28 * SR), x = noise(n);
  biquad('hp', 650, 0.7)(x); biquad('lp', 2600, 0.6)(x); normPeak(x);
  const v = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; let e = 0;
    for (const o of [0, 0.009, 0.018]) if (t >= o) e += Math.exp(-(t - o) / 0.004) * 0.7;
    if (t >= 0.027) e += Math.exp(-(t - 0.027) / 0.07);
    v[i] = x[i] * e * 0.25 * (1 - Math.exp(-t / 0.0008));
  }
  endFade(v, 15); put(st, s0, v, { gain: vel, rv: 0.25, pan: 0.05 });
}
function hat(st, s0, vel, open) {
  const n = Math.round((open ? 0.3 : 0.1) * SR), x = noise(n);
  biquad('hp', 6500, 0.7)(x); biquad('lp', 11500, 0.7)(x); normPeak(x);
  const tau = open ? 0.085 : 0.016, v = new Float64Array(n);
  for (let i = 0; i < n; i++) v[i] = x[i] * Math.exp(-i / SR / tau) * 0.07 * (1 - Math.exp(-i / SR / 0.0008));
  endFade(v, 10); put(st, s0, v, { gain: vel, pan: open ? 0.25 : -0.15, rv: 0.04 });
}
// rising filtered-noise + sine-glide riser; ends 'endS' with a soft fade (no cut)
function riser(st, s0, s1, fc0, fc1, amp, gA0, gA1, gAmp) {
  const n = s1 - s0, x = noise(n), v = new Float64Array(n);
  let low = 0, band = 0; const q1 = 0.7;
  for (let i = 0; i < n; i++) {
    const fc = fc0 * Math.pow(fc1 / fc0, i / n), f = 2 * Math.sin(Math.PI * fc / SR);
    low += f * band; const high = x[i] - low - q1 * band; band += f * high; v[i] = band;
  }
  normPeak(v);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const r = i / n, e = r * r * (1 - Math.exp(-i / (0.02 * SR)));
    v[i] *= amp * e;
    if (gAmp) { const f = gA0 * Math.pow(gA1 / gA0, r); ph += TAU * f / SR; v[i] += Math.sin(ph) * gAmp * e; }
  }
  endFade(v, 30); put(st, s0, v, { rv: 0.08, pan: 0 });
}

// ---------- musical data ----------
const CH = {
  D:  { arp: [62, 66, 69, 74], pad: [50, 57, 62, 66], bass: 38 },
  Bm: { arp: [59, 62, 66, 71], pad: [47, 54, 59, 62], bass: 35 },
  G:  { arp: [55, 59, 62, 67], pad: [43, 50, 55, 59], bass: 31 },
  A:  { arp: [57, 61, 64, 69], pad: [45, 52, 57, 61], bass: 33 },
};
const PROG = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'D'];
const chordAt = s => CH[PROG[Math.min(9, Math.floor(s / BAR))]];
const MEL = { // two 2-beat cells per chord (A,B); rhythm steps 0,3,4,6 (durations 3,1,2,2 sixteenths)
  D: [[78, 74, 76, 78], [78, 74, 76, 81]], Bm: [[78, 74, 76, 74], [78, 76, 74, 71]],
  G: [[79, 74, 76, 74], [79, 74, 71, 74]], A: [[76, 73, 76, 81], [81, 76, 73, 76]],
};
const MSTEP = [0, 3, 4, 6], MDUR = [3, 1, 2, 2];
const ARPPAT = [0, 2, 1, 3, 2, 3, 1, 2];
const BASS_FULL = { 0: [3, 0], 3: [2, 0], 6: [2, 12], 8: [3, 0], 11: [2, 0], 14: [2, 12] };
const BASS_THIN = { 0: [6, 0], 8: [6, 0] };

const T_REVEAL = SYNC.revealStart, T_THIN = SCENES[2].start, T_COPY = SYNC.copyPress, T_FINAL = SYNC.outro + 0.5;
const CUTS = SCENES.slice(1).map(s => s.start);
const region = t => t < T_REVEAL ? 'hook' : t < T_THIN ? 'full' : t < T_COPY ? 'thin' : t < T_FINAL ? 'full' : 'end';
const ARP_AMP = 0.17, MEL_AMP = 0.17, TICK_DB = -18;

// ---------- stems ----------
const music = mkStem(), duck = mkStem(), drums = mkStem(), fx = mkStem();

// pad (ducked)
for (let b = 0; b < 10; b++) {
  const t = b * 2, r = region(t + 0.001), thin = t >= T_THIN && t < T_COPY;
  const amp = (t < T_REVEAL ? 1.5 : thin ? 1.1 : 1) * 0.05;
  for (const m of CH[PROG[b]].pad) {
    if (b === 9) padVoice(duck, b * BAR, m, 1.9, amp * 1.2, 0.06, 0.4, 0.8);
    else padVoice(duck, b * BAR, m, 2.0 + 0.3, amp, 0.3, 0.3);
  }
}
// bass (ducked)
for (let s = 0; s < N / S16; s++) {
  const t = s * 0.125, sp = s % 16, r = region(t);
  if (r === 'hook' || r === 'end') continue;
  const it = (r === 'thin' ? BASS_THIN : BASS_FULL)[sp]; if (!it) continue;
  bassNote(duck, s * S16, chordAt(s * S16).bass + it[1], it[0] * 0.125 * 0.92, 0.34 * (r === 'thin' ? 0.9 : 1));
}
bassNote(duck, bt(T_FINAL), 38, 1.8, 0.34, 0.9);

// arp (hook is filtered + softer; filter lifts 9->14)
const arpFc = t => t < T_REVEAL ? 650 + 550 * (t / T_REVEAL) : t < T_THIN ? 1900 : t < T_COPY ? 1000 + 1200 * (t - T_THIN) / (T_COPY - T_THIN) : 2000;
for (let s = 0; s < T_FINAL * 8; s += 2) {
  const t = s * 0.125, p = (s / 2) % 8, sm = s * S16, m = chordAt(sm).arp[ARPPAT[p]];
  pluck(music, sm, m, { dur: 0.7, amp: ARP_AMP * (t < T_REVEAL ? 1.2 : 1) * (p === 0 ? 1.12 : 1), fc: arpFc(t), tau: 0.17, att: 0.006, pan: p % 2 ? 0.28 : -0.28, rv: 0.22, dl: 0.55 });
}
// final chord ring-out under the decaying tail
for (const m of [50, 57, 62, 66, 69, 74]) pluck(music, bt(T_FINAL), m, { dur: 2.4, amp: ARP_AMP * 0.7, fc: 1500, tau: 1.2, hdecay: 0.5, att: 0.008, rv: 0.35, pan: (m % 5 - 2) * 0.12 });

// melody: enters at Find (5.0), returns for Plates; repeats a 2-beat cell
const melRanges = [[SCENES[1].start, SCENES[2].start], [SCENES[3].start, SYNC.outro]];
for (const [a, b] of melRanges) for (let c = bt(a); c < bt(b); c += 2 * BEAT) {
  const cell = (Math.floor(c / (2 * BEAT)) % 2), notes = MEL[PROG[Math.floor(c / BAR)]][cell];
  for (let k = 0; k < 4; k++) {
    const sm = c + MSTEP[k] * S16; if (sm >= bt(b)) continue;
    pluck(music, sm, notes[k], { dur: MDUR[k] * 0.125 * 1.5, amp: MEL_AMP * (k === 0 ? 1.1 : 0.95), fc: 1700, tau: 0.24, hdecay: 0.25, att: 0.01, hmax: 3200, tilt: 1.05, pan: 0.05, rv: 0.2, dl: 0.35 });
  }
}

// drums
const kv = (s, v) => kick(drums, s * S16, v);
function fill(tcut) { const s = bt(tcut); clap(drums, s - 2 * S16, 0.3); clap(drums, s - S16, 0.45); hat(drums, s, 0.75, true); }
for (let s = 0; s < T_FINAL * 8; s++) {
  const t = s * 0.125, sp = s % 16, r = region(t), sm = s * S16;
  if (r === 'hook') { if (t >= 1.75) hat(drums, sm, 0.2 + 0.2 * (t - 1.75) / 0.25, false); continue; }
  if (r === 'full') {
    if (sp % 4 === 0) kick(drums, sm, t === T_REVEAL || t === T_COPY ? 1.12 : 1);
    if (sp === 4 || sp === 12) clap(drums, sm, 1);
    if (sp % 4 === 2) hat(drums, sm, 0.75, false); else if (sp % 4 === 0) hat(drums, sm, 0.4, false); else if (sp === 7 || sp === 15) hat(drums, sm, 0.3, false);
  } else if (r === 'thin') {
    if (sp === 0 || sp === 8) kick(drums, sm, 0.72);
    if (sp % 4 === 2) hat(drums, sm, 0.5, false);
    if (t >= 13) hat(drums, sm, 0.1 + 0.35 * (t - 13), false);
  }
}
for (const c of CUTS) { fill(c); }
if (!kicks.some(k => k[0] === bt(T_THIN))) kick(drums, bt(T_THIN), 0.7);
clap(drums, bt(T_FINAL) - 2 * S16, 0.3); clap(drums, bt(T_FINAL) - S16, 0.45);   // fill into the last downbeat
kick(drums, bt(T_FINAL), 1.1); hat(drums, bt(T_FINAL), 0.7, true);               // last downbeat, then drums stop
if (T_COPY) hat(drums, bt(T_COPY), 0.7, true);

// sidechain: kick -> bass + pad
const sc = new Float64Array(N).fill(1);
for (const [s0, vel] of kicks) { const n = Math.min(Math.round(0.45 * SR), N - s0); for (let i = 0; i < n; i++) { const t = i / SR, g = 1 - 0.5 * Math.min(1, vel) * (1 - Math.exp(-t / 0.004)) * Math.exp(-t / 0.13); if (g < sc[s0 + i]) sc[s0 + i] = g; } }
for (let i = 0; i < N; i++) { duck.L[i] *= sc[i]; duck.R[i] *= sc[i]; }

// ---- FX ----
const bell = (st, s0, midi, o) => pluck(st, s0, midi, Object.assign({ dur: 1.2, amp: 0.15, fc: 1200, tau: 0.45, att: 0.004, hmax: 2800, tilt: 1.6, hdecay: 0.5, rv: 0.35, dl: 0.2 }, o));
function motif(t, big) {
  const s = bt(t), k = big ? 1.35 : 1;
  thump(fx, s, 170, 62, 0.02, 0.035, 0.26 * k * (big ? 1 : 0.7), 0.25, { rv: 0.05 });
  bell(fx, s, 69, { amp: 0.12 * k, pan: -0.1, tau: big ? 0.6 : 0.45 });
  bell(fx, s + 2 * S16, 74, { amp: 0.135 * k, pan: 0.1, tau: big ? 0.7 : 0.5 });
  if (big) { bell(fx, s, 57, { amp: 0.09, tau: 0.5 }); bell(fx, s + 2 * S16, 62, { amp: 0.1, tau: 0.6 }); }
}
// hook: riser into hookPress, then motif
const preGap = 240;
riser(fx, 0, bt(SYNC.hookPress) - preGap, 300, 1500, 0.07, 220, 440, 0.025);
motif(SYNC.hookPress, false);
// build toward copyPress
riser(fx, bt(12.5), bt(T_COPY) - preGap, 300, 1900, 0.08, 220, 440, 0.03);
motif(T_COPY, true);
// find pick click
pluck(fx, bt(SYNC.findPick), 81, { dur: 0.12, amp: 0.045, fc: 2200, tau: 0.03, att: 0.0008, hmax: 2400, rv: 0.4 });
// typing ticks: one per char, 16ths, notes from the current chord, -18 dB vs arp
const TP = [0, 1, 2, 3, 2, 1];
function typing({ text, start }) {
  for (let n = 0; n < text.length; n++) {
    const s = bt(start + n * 0.125), m = chordAt(s).arp[TP[n % 6]] + 12;
    pluck(fx, s, m, { dur: 0.25, amp: ARP_AMP * db2(TICK_DB), fc: 2000, tau: 0.07, att: 0.002, hmax: 2600, pan: n % 2 ? 0.35 : -0.35, rv: 0.6 });
  }
}
typing(SYNC.findTyping); typing(SYNC.role); typing(SYNC.objective);
// plates: three rising in-key stabs + soft thud
const STAB = [[69, 73], [73, 76], [74, 78, 81]];
SYNC.plates.forEach((t, i) => {
  const s = bt(t);
  STAB[i].forEach((m, j) => pluck(fx, s, m, { dur: 0.4, amp: 0.1 * (1 + i * 0.1), fc: 1600, tau: 0.13, att: 0.003, hmax: 2600, pan: (j - 1) * 0.25, rv: 0.3, dl: 0.2 }));
  thump(fx, s, 100, 55, 0.04, 0.07, 0.3, 0.3);
});
// outro: A - D - F# resolved up, landing on the final D chord at T_FINAL
{
  const s = bt(SYNC.outro);
  thump(fx, s, 170, 62, 0.02, 0.035, 0.22, 0.25, { rv: 0.05 });
  bell(fx, s, 69, { amp: 0.16, tau: 0.5, pan: -0.1 });
  bell(fx, s + 2 * S16, 74, { amp: 0.17, tau: 0.55, pan: 0.05 });
  bell(fx, s + 4 * S16, 78, { amp: 0.19, tau: 1.0, dur: 2.0, pan: 0.1, rv: 0.45 });
  bell(fx, s + 4 * S16, 62, { amp: 0.09, tau: 1.0, dur: 2.0, rv: 0.4 });
}

// ---------- delay (dotted 8th = 3 sixteenths) and shared small reverb ----------
function addDelay(st) {
  const x = Float64Array.from(st.dl); let y = 0; const k = 1 - Math.exp(-TAU * 2800 / SR);
  for (let i = 0; i < N; i++) { y += k * (x[i] - y); x[i] = y; }
  const D = 3 * S16;
  [[1, 'R', 0.4], [2, 'L', 0.26], [3, 'R', 0.16], [4, 'L', 0.1]].forEach(([m, ch, g]) => {
    const off = m * D, dst = ch === 'L' ? st.L : st.R;
    for (let i = 0; i + off < N; i++) dst[i + off] += x[i] * g;
  });
}
function reverb(st, level) {
  const x = Float64Array.from(st.rv); biquad('hp', 250, 0.7)(x); biquad('lp', 5000, 0.7)(x);
  const pre = Math.round(0.012 * SR);
  const mk = (lens, g) => {
    const out = new Float64Array(N);
    for (const Ln of lens) { const buf = new Float64Array(Ln); let idx = 0, lp = 0;
      for (let i = pre; i < N; i++) { const y = buf[idx]; lp = y * 0.65 + lp * 0.35; buf[idx] = x[i - pre] + g * lp; if (++idx === Ln) idx = 0; out[i] += y * 0.25; } }
    for (const [Ln, ag] of [[556, 0.5], [441, 0.5]]) { const buf = new Float64Array(Ln); let idx = 0;
      for (let i = 0; i < N; i++) { const b = buf[idx], v = out[i] + (-ag) * b; buf[idx] = v; out[i] = b + ag * v; if (++idx === Ln) idx = 0; } }
    return out;
  };
  const wl = mk([1423, 1559, 1693, 1811], 0.8), wr = mk([1459, 1597, 1733, 1861], 0.8);
  for (let i = 0; i < N; i++) { st.L[i] += wl[i] * level; st.R[i] += wr[i] * level; }
}
// combine ducked bass/pad into music, then effects
for (let i = 0; i < N; i++) { music.L[i] += duck.L[i]; music.R[i] += duck.R[i]; music.rv[i] += duck.rv[i]; }
addDelay(music); addDelay(fx);
reverb(music, 0.38); reverb(fx, 0.38); reverb(drums, 0.3);

// ---------- master ----------
const stems = { music: [music, G_MU], drums: [drums, G_DR], fx: [fx, G_FX] };
const mixL = new Float64Array(N), mixR = new Float64Array(N);
for (const k in stems) { const [s, g] = stems[k]; for (let i = 0; i < N; i++) { mixL[i] += s.L[i] * g; mixR[i] += s.R[i] * g; } }
// light bus compression
{
  let e = 0; const ca = 1 - Math.exp(-1 / (0.012 * SR)), cr = 1 - Math.exp(-1 / (0.15 * SR)); let gs = 1;
  const thr = -22, ratio = 1.8;
  for (let i = 0; i < N; i++) {
    const a = Math.max(Math.abs(mixL[i]), Math.abs(mixR[i]));
    e += (a > e ? ca : cr) * (a - e);
    const d = 20 * Math.log10(e + 1e-9), tg = d > thr ? Math.pow(10, -(d - thr) * (1 - 1 / ratio) / 20) : 1;
    gs += (tg < gs ? 0.003 * 0 + (1 - Math.exp(-1 / (0.01 * SR))) : (1 - Math.exp(-1 / (0.12 * SR)))) * (tg - gs);
    mixL[i] *= gs; mixR[i] *= gs;
  }
}
const fade = new Float64Array(N).fill(1);
{ const a = bt(19.0), b = bt(19.8); for (let i = a; i < N; i++) fade[i] = i >= b ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (i - a) / (b - a)); }
const softclip = x => { const k = 0.6, a = Math.abs(x); return a <= k ? x : Math.sign(x) * (k + (1 - k) * Math.tanh((a - k) / (1 - k))); };
function limiter(L, R, ceil) {
  const Lk = 120, g = new Float64Array(N);
  for (let i = 0; i < N; i++) { const a = Math.max(Math.abs(L[i]), Math.abs(R[i])); g[i] = a > ceil ? ceil / a : 1; }
  const m = new Float64Array(N), dq = new Int32Array(N); let h = 0, t = 0;   // sliding min over [i-Lk, i+Lk]
  for (let i = 0; i < N + Lk; i++) {
    if (i < N) { while (t > h && g[dq[t - 1]] >= g[i]) t--; dq[t++] = i; }
    const c = i - Lk; if (c >= 0) { while (dq[h] < c - Lk) h++; m[c] = g[dq[h]]; }
  }
  const pre = new Float64Array(N + 1); for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + m[i];
  const rel = 1 - Math.exp(-1 / (0.06 * SR)); let e = 1;
  for (let i = 0; i < N; i++) {
    const lo = Math.max(0, i - Lk), hi = Math.min(N - 1, i + Lk), gs = (pre[hi + 1] - pre[lo]) / (hi - lo + 1);
    e = gs < e ? gs : e + rel * (gs - e); L[i] *= e; R[i] *= e;
  }
}
function kLoud(L, R) {
  const f = (x, b, a) => { const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i]; const o = b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; } return y; };
  const k = x => f(f(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
  const zl = k(L), zr = k(R), blk = 19200, hop = 4800, ms = [];
  for (let s = 0; s + blk <= N; s += hop) { let a = 0, b = 0; for (let i = s; i < s + blk; i++) { a += zl[i] * zl[i]; b += zr[i] * zr[i]; } ms.push((a + b) / blk); }
  const l = v => -0.691 + 10 * Math.log10(v); const g1 = ms.filter(v => l(v) > -70);
  const r = l(g1.reduce((a, b) => a + b, 0) / g1.length) - 10; const g2 = g1.filter(v => l(v) > r);
  return l(g2.reduce((a, b) => a + b, 0) / g2.length);
}
function master(gain) {
  const L = new Float64Array(N), R = new Float64Array(N);
  for (let i = 0; i < N; i++) { L[i] = softclip(mixL[i] * gain); R[i] = softclip(mixR[i] * gain); }
  limiter(L, R, CEIL);
  for (let i = 0; i < N; i++) { L[i] *= fade[i]; R[i] *= fade[i]; }
  return [L, R];
}
let gain = 1; { const l0 = kLoud(mixL, mixR); gain = Math.pow(10, (TARGET - l0) / 20); }
let outL, outR;
for (let it = 0; it < 6; it++) { [outL, outR] = master(gain); const l = kLoud(outL, outR); if (Math.abs(l - TARGET) < 0.05) break; gain *= Math.pow(10, (TARGET - l) / 20); }
console.log('internal LUFS', kLoud(outL, outR).toFixed(2), 'master gain dB', (20 * Math.log10(gain)).toFixed(2));

// ---------- write ----------
function wav(file, L, R) {
  const buf = Buffer.alloc(44 + N * 6); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
  let o = 44; const q = x => Math.max(-8388608, Math.min(8388607, Math.round(x * 8388607)));
  for (let i = 0; i < N; i++) { buf.writeIntLE(q(L[i]), o, 3); buf.writeIntLE(q(R[i]), o + 3, 3); o += 6; }
  fs.writeFileSync(file, buf);
}
fs.mkdirSync(path.join(WORK, 'stems'), { recursive: true });
wav(path.join(WORK, 'audio.wav'), outL, outR);
const mono = {}; const STEM_HR = 0.5; // stems are written -6 dB (pre bus-comp/limiter) so they never clip

for (const k in stems) {
  const [s, g] = stems[k], L = new Float64Array(N), R = new Float64Array(N);
  for (let i = 0; i < N; i++) { L[i] = s.L[i] * g * gain * fade[i] * STEM_HR; R[i] = s.R[i] * g * gain * fade[i] * STEM_HR; }
  wav(path.join(WORK, 'stems', k + '.wav'), L, R);
  mono[k] = L.map((v, i) => v + R[i]);
  let pk = 0, ss = 0; for (let i = 0; i < N; i++) { pk = Math.max(pk, Math.abs(L[i])); ss += L[i] * L[i]; }
  console.log(k.padEnd(6), 'peak dB', (20 * Math.log10(pk)).toFixed(1), 'rms dB', (10 * Math.log10(ss / N)).toFixed(1));
}
// ---------- verification: transient onsets in fx stem vs grid ----------
const fxm = mono.fx;
function onset(t) {
  const c = bt(t), res = i => Math.abs(fxm[i] - (2 * fxm[i - 1] - fxm[i - 2]));
  let pk = 0; for (let i = c; i < c + 0.03 * SR; i++) pk = Math.max(pk, res(i));
  for (let i = c - Math.round(0.001 * SR); i < c + 0.1 * SR; i++) if (res(i) > 0.1 * pk) return (i - c) / SR * 1000;
  return NaN;
}
for (const [n, t] of [['hookPress', SYNC.hookPress], ['findPick', SYNC.findPick], ['copyPress', T_COPY], ['plate1', SYNC.plates[0]], ['plate2', SYNC.plates[1]], ['plate3', SYNC.plates[2]], ['outro', SYNC.outro]])
  console.log('onset', n.padEnd(9), onset(t).toFixed(3), 'ms');
// fx vs music: windows where fx peak exceeds music peak
let bad = 0, wnd = 0.1 * SR;
for (let s = 0; s < N; s += wnd) { let a = 0, b = 0; for (let i = s; i < s + wnd; i++) { a = Math.max(a, Math.abs(fxm[i])); b = Math.max(b, Math.abs(mono.music[i] + mono.drums[i])); } if (a > b && b > 1e-4) { bad++; console.log('fx>music at', (s / SR).toFixed(1)); } }
console.log('windows fx>music:', bad);
let last = 0; for (let i = 0; i < N; i++) if (Math.abs(outL[i]) > 0 || Math.abs(outR[i]) > 0) last = i;
console.log('last non-zero sample', last, '->', (last / SR).toFixed(3), 's; samples', N);
