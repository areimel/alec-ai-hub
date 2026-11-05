// Cut B: The Trailer. Absolute integer frames. Do not re-derive; import these.
export * from "../engine/grid.js";
export const CUT = { id: "trailer", out: "brag-trailer" };
export const SCENES = [
  { id: "t1",  start: 0,   end: 52 },  // EVERYONE HAS AI.
  { id: "t2",  start: 52,  end: 104 }, // FEW COMMAND IT.
  { id: "t3",  start: 104, end: 130 }, // Plate slam (drop)
  { id: "t4",  start: 130, end: 208 }, // Numerals
  { id: "t5",  start: 208, end: 260 }, // FIND IT.
  { id: "t6",  start: 260, end: 312 }, // FILL IT IN.
  { id: "t7",  start: 312, end: 364 }, // COPY IT.
  { id: "t8",  start: 364, end: 468 }, // Agents
  { id: "t9",  start: 468, end: 520 }, // FREE. NO ACCOUNT.
  { id: "t10", start: 520, end: 624 }, // Outro
];
export const SYNC = {
  impactOpen: 0,
  fewCommand: 52,
  drop: 104,
  numerals: [130, 156, 182],       // 18 / 5 / 4 land
  search: { text: "marketing", n0: 64 },
  lock: 247,
  fields: [
    { field: "productName", text: "Halcyon", n0: 81 },
    { field: "painPoints", text: "slow ops", n0: 88 },
  ],
  copyPress: 325,                  // bar 7 beat 2: flips to Copied, white flash
  names: [364, 377, 390, 403, 416],// one agent per beat, stacking
  free: 468,                       // everything cuts; bar 10
  noAccount: 494,                  // bar 10 beat 3
  finalDrop: 520,
  lastHit: 572,
};
