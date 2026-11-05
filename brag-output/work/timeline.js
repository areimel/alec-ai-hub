// Single source of truth for timing. Imported by the browser composition AND the Node audio synth.
export const W = 1080, H = 1080, FPS = 30, BPM = 120;
export const BEAT = 60 / BPM;            // 0.5s = 15 frames
export const SIXTEENTH = BEAT / 4;       // 0.125s
export const DURATION = 20;              // seconds
export const TOTAL_FRAMES = DURATION * FPS; // 600

export const COLORS = {
  charcoal: "#141310", panel: "#1c1b17", ivory: "#efebe0", orange: "#ff4d00",
  rule: "#3f3b31", muted: "#aaa596",
};

// Absolute seconds. Every boundary is a beat (a frame number divisible by 15).
export const SCENES = [
  { id: "a", start: 0,    end: 5 },    // Hook (0-2) + Reveal (2-5)
  { id: "b", start: 5,    end: 9 },    // Find
  { id: "c", start: 9,    end: 15 },   // Fill in (9-14) + Copy (14-15)
  { id: "d", start: 15,   end: 17.5 }, // Plates
  { id: "e", start: 17.5, end: 20 },   // Outro
];

// Dip through charcoal around each cut: new content must be settled quickly; the shell applies this.
export const DIP = 4 / FPS; // old fades out over last 4 frames, new fades in over first 4 frames

// Musical/visual sync points, absolute seconds. Scenes and audio both read these. Do not re-derive.
export const SYNC = {
  hookPress: 1.0,          // cursor presses Copy, flips to "Copied"
  revealStart: 2.0,
  findTyping: { text: "template", start: 5.5 },  // one char per 16th
  findPick: 8.0,           // cursor presses AI Prompt Template card
  role: { field: "role", text: "reviewing code", start: 9.5 },          // ends 11.25
  objective: { field: "objective", text: "catch bugs early", start: 11.5 }, // ends 13.5
  copyPress: 14.0,
  plates: [15.0, 15.5, 16.0], // each plate lands on this beat
  outro: 17.5,
};

// Number of characters of `text` shown at absolute time t, one per 16th note.
export function typedCount(text, start, t) {
  return Math.max(0, Math.min(text.length, Math.floor((t - start) / SIXTEENTH + 1e-6) + (t >= start ? 1 : 0)));
}
