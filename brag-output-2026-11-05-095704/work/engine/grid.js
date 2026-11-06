// Single source of truth for the musical/visual grid. Imported by browser AND Node. All integers.
export const W = 1920, H = 1080, FPS = 30;
export const BEAT = 13, BAR = 52, TOTAL = 624;          // frames (138.4615 BPM = 1800/13; 12 bars)
export const SR = 48000, SAMPLES_PER_FRAME = 1600;      // beat = 20800 samples, 16th = 5200, total = 998400
export const TOTAL_SAMPLES = TOTAL * SAMPLES_PER_FRAME;
export const COLORS = { charcoal: "#141310", panel: "#1c1b17", ivory: "#efebe0", orange: "#ff4d00", rule: "#3f3b31", muted: "#aaa596" };

export const barFrame = (bar) => (bar - 1) * BAR;       // bar is 1-based
export const beatFrame = (beat) => beat * BEAT;         // beat is 0-based from frame 0
// Frame of 16th-note index n (0-based). A 16th is 3.25 frames: quantised to 3,3,3,4 identically in picture and sound.
export const s16Frame = (n) => Math.floor((n * 13) / 4);
export const frameSample = (f) => f * SAMPLES_PER_FRAME;
export const s16Sample = (n) => n * 5200;               // exact musical position (sound only)
// Chars of `text` visible at frame f, one per 16th, starting at 16th index n0.
export function typedCount(text, n0, f) {
  let c = 0;
  for (let i = 0; i < text.length; i++) if (f >= s16Frame(n0 + i)) c = i + 1; else break;
  return c;
}
