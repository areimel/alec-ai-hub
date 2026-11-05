// Cut A: The Briefing. Absolute integer frames. Do not re-derive; import these.
export * from "../engine/grid.js";
export const CUT = { id: "briefing", out: "brag-briefing" };
export const SCENES = [
  { id: "s1", start: 0,   end: 104 }, // Hook
  { id: "s2", start: 104, end: 208 }, // Reveal (drop)
  { id: "s3", start: 208, end: 260 }, // Find
  { id: "s4", start: 260, end: 364 }, // Fill and copy
  { id: "s5", start: 364, end: 468 }, // Operatives
  { id: "s6", start: 468, end: 520 }, // Declassified
  { id: "s7", start: 520, end: 624 }, // Outro
];
export const SYNC = {
  hookLineFull: 26,                // hook line fully revealed
  stampAccess: 52,                 // ACCESS GRANTED slam, bar 2
  drop: 104,
  plateLand: 104,
  statLands: [117, 130, 143],      // stat strip lands/counts finish on beats
  search: { text: "marketing", n0: 64 },     // bar 5 downbeat, one letter per 16th; ends f237
  lock: 247,                       // target lock on Marketing Email Template Generator
  fields: [                        // sample inputs; 16th index n0
    { field: "productName", text: "Halcyon", n0: 81 },
    { field: "painPoints", text: "slow reports", n0: 88 },
    { field: "callToAction", text: "Demo", n0: 100 },
  ],
  copyPress: 338,                  // Copy prompt flips to Copied, n=104
  cards: [364, 377, 390, 403, 416],// one agent card per beat
  declassified: 468,               // bar 10: stamp + impact, kick out
  finalDrop: 520,                  // bar 11
  lastHit: 572,                    // bar 12 downbeat: last bass hit then tail
};
