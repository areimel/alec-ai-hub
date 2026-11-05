// Cut A, The Briefing: arrangement only. Voices, mix and master live in ../engine/synth.mjs.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYNC } from './timeline.js';
import { createEngine, parseOpts, finish, frameS, s16Sample } from '../engine/synth.mjs';

const e = createEngine(parseOpts());
const sp = e.sp, f = frameS;

// Acid automation (bar is 1-based, fractional ok): closed and growling -> fully squelching -> tail -> final release
e.setCurve('cutoff', [[1, 230], [2, 300], [2.9, 420], [3, 650], [5, 820], [6, 1050], [7, 1500], [7.9, 2000], [8, 2500], [9, 3300], [9.99, 3600], [10, 450], [10.9, 1800], [11, 3400], [12, 2200], [13, 700]]);
e.setCurve('res',    [[1, 0.8], [3, 0.8], [5, 0.84], [7, 0.88], [8, 0.92], [9.5, 0.94], [10, 0.93], [11, 0.9], [12, 0.8], [13, 0.7]]);
e.setCurve('drive',  [[1, 1.8], [3, 2.2], [8, 2.8], [10, 2.4], [11, 3.0], [13, 2.2]]);
e.setCurve('level',  [[1, 1.0], [3, 1], [10, 0.9], [11, 1], [13, 0.95]]);

// bars 1-2: filtered acid (sparse hook) + rumble drone, no kick; faint phantom pump for groove
e.acid(1, 3, { variant: 'sparse' });
e.droneBars(1, 3.5, 1.0);
for (let b = 1; b < 3; b++) for (let s = 0; s < 16; s += 4) e.phantomDuck(sp(b, s), 0.22);
e.stampHit(f(SYNC.stampAccess), 0.8);
e.riser(f(SYNC.stampAccess) + 5200, f(SYNC.drop), 1.0);

// bars 3-4 DROP
e.impact(f(SYNC.drop), 0.55);
e.acid(3, 5, { variant: 'full' });
e.groove(3, 5, { openHat: 0.9, hat16: 0.2 });
// bars 5-7 filter gradually opening, ticks while typing, copy hit
e.acid(5, 8, { variant: 'full' });
e.groove(5, 8, { openHat: 0.9, hat16: 0.26 });
e.typing(SYNC.search.text, SYNC.search.n0);
for (const fld of SYNC.fields) e.typing(fld.text, fld.n0, 0.9);
e.copyHit(f(SYNC.copyPress), 1);
// bars 8-9 acid peak, stabs on the card frames (Am / Bb alternating, last one up an octave)
e.acid(8, 10, { variant: 'peak' });
e.groove(8, 10, { openHat: 1, hat16: 0.32, kickFill: true });
SYNC.cards.forEach((fr, i) => e.stabHit(f(fr), ['Am', 'Bb', 'Am', 'Bb', 'AmHi'][i], i === 4 ? 1.1 : 1));
// bar 10 breakdown: kick and hats out, impact on DECLASSIFIED, resonant bass tail only, reverse riser into bar 11
e.impact(f(SYNC.declassified), 1);
e.acidNote(f(SYNC.declassified), sp(11) - f(SYNC.declassified) - 3000, 33, { acc: 1, rel: 0.3 });
e.droneBars(10, 11, 0.7, 0.1, 0.3);
e.riser(sp(10, 4), f(SYNC.finalDrop), 1.15);
// bars 11-12 final drop; last hit at lastHit, then everything rings out
e.impact(f(SYNC.finalDrop), 0.6);
e.acid(11, 12, { variant: 'peak' });
e.groove(11, 12, { openHat: 1, hat16: 0.3 });
e.stabHit(sp(11, 6), 'Am', 0.8); e.stabHit(sp(11, 11), 'Bb', 0.8);
e.kick(f(SYNC.lastHit), 1.1, { rumble: 1.4 });
e.acidNote(f(SYNC.lastHit), 30000, 33, { acc: 1, rel: 0.22 });
e.hat(f(SYNC.lastHit), 0.9, true); e.clap(f(SYNC.lastHit), 0.8);
e.stampHit(f(SYNC.lastHit), 0.6);

finish(e, path.dirname(fileURLToPath(import.meta.url)));
