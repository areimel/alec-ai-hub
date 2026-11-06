// Cut B, The Trailer: arrangement only, harder and more aggressive than the Briefing. Same synth engine and riff family.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYNC } from './timeline.js';
import { createEngine, parseOpts, finish, frameS } from '../engine/synth.mjs';

const e = createEngine(parseOpts());
const sp = e.sp, f = frameS;

// Acid automation: open and snarling from the first bar, squelch spike in bar 6, peak 8-9, full cut in bar 10.
e.setCurve('cutoff', [[1, 900], [2, 650], [2.9, 2200], [3, 1500], [5, 1900], [6, 1000], [6.35, 4600], [6.75, 1200], [7, 2000], [8, 3000], [9, 4200], [9.99, 4600], [11, 3800], [12, 2400], [13, 800]]);
e.setCurve('res',    [[1, 0.88], [3, 0.88], [6, 0.95], [6.5, 0.97], [8, 0.94], [11, 0.93], [12, 0.85], [13, 0.7]]);
e.setCurve('drive',  [[1, 3.2], [8, 3.6], [11, 3.8], [13, 2.6]]);
e.setCurve('level',  [[1, 1.0]]);

// bar 1: huge impact at frame 0, then acid alone (starts on beat 2)
e.impact(f(SYNC.impactOpen), 1.45);
e.acid(1, 2, { variant: 'hard', fromStep: 4 });
e.droneBars(1, 3, 0.6, 0.2, 0.2);
for (let b = 1; b < 3; b++) for (let s = 0; s < 16; s += 4) e.phantomDuck(sp(b, s), 0.3);
// bar 2: acid opening under a riser, hit on FEW COMMAND IT
e.acid(2, 3, { variant: 'hard' });
e.stampHit(f(SYNC.fewCommand), 1.2);
e.riser(f(SYNC.fewCommand) + 5200, f(SYNC.drop), 1.3, 300, 6000);
// bars 3-4 DROP, hits on each numeral (stamp + stab)
e.impact(f(SYNC.drop), 0.75);
e.acid(3, 5, { variant: 'hard' });
e.groove(3, 5, { openHat: 1, hat16: 0.34, kickVel: 1.05 });
SYNC.labels.forEach((fr, i) => { e.stampHit(f(fr), 1.1 + 0.1 * i); e.stabHit(f(fr), ['Am', 'Bb', 'AmHi'][i], 0.9); });
// bars 5-7 full groove, ticks on the typing, squelch in bar 6, hit + flash on COPY
e.acid(5, 8, { variant: 'hard' });
e.groove(5, 8, { openHat: 1, hat16: 0.36, kickFill: true });
e.typing(SYNC.search.text, SYNC.search.n0);
for (const fld of SYNC.fields) e.typing(fld.text, fld.n0, 0.9);
e.copyHit(f(SYNC.copyPress), 1.3); e.flash(f(SYNC.copyPress), 1.4); e.impact(f(SYNC.copyPress), 0.35);
// bars 8-9 peak, accents on the agent names
e.acid(8, 10, { variant: 'peak' });
e.groove(8, 10, { openHat: 1.1, hat16: 0.42, kickFill: true, kickVel: 1.1 });
SYNC.names.forEach((fr, i) => { e.stabHit(f(fr), ['Am', 'Bb', 'Am', 'Bb', 'AmHi'][i], 1.05); e.stampHit(f(fr), 0.55); });
// bar 10: everything cuts. Hit on FREE, second hit on NO ACCOUNT, riser into bar 11
e.mute(f(SYNC.free), sp(11), ['bass', 'rumble', 'drums', 'stab']);   // hard cut: only the two hits and the riser remain
e.stampHit(f(SYNC.free), 1.5); e.impact(f(SYNC.free), 0.4);
e.stampHit(f(SYNC.noAccount), 1.5); e.impact(f(SYNC.noAccount), 0.35);
e.riser(f(SYNC.noAccount) + 5200, f(SYNC.finalDrop), 1.3, 300, 6000);
// bars 11-12 final drop, last hit, then everything rings out
e.impact(f(SYNC.finalDrop), 0.8);
e.acid(11, 12, { variant: 'peak' });
e.groove(11, 12, { openHat: 1.1, hat16: 0.4, kickVel: 1.1 });
e.stabHit(sp(11, 6), 'Am', 0.9); e.stabHit(sp(11, 11), 'Bb', 0.9); e.stabHit(sp(11, 14), 'AmHi', 0.8);
e.kick(f(SYNC.lastHit), 1.15, { rumble: 1.4 });
e.acidNote(f(SYNC.lastHit), 30000, 33, { acc: 1, rel: 0.22 });
e.hat(f(SYNC.lastHit), 0.9, true); e.clap(f(SYNC.lastHit), 0.9); e.stampHit(f(SYNC.lastHit), 0.8);

finish(e, path.dirname(fileURLToPath(import.meta.url)));
