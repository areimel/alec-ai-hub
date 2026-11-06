# Composition contract (all subagents read this first)

Two 1920x1080, 30fps, 624-frame (20.8s) launch videos for CEOs/executives who want to become AI power users. Spy-agency look. Storyboard and copy: `../brag-plan.md` (authoritative; on-screen text is verbatim from it).

## Layout (paths relative to this `work/` folder)
- `engine/grid.js`: grid constants. `briefing/timeline.js`, `trailer/timeline.js`: scenes and sync frames. **Lead-owned: never edit; ask the lead. Never hard-code a frame that exists there.**
- `facts.json`: real counts, labels, selectors. Lead-owned. Never hard-code a product count; read it from the built DOM or this file.
- `site/`: fresh real site build. Read-only.
- `engine/`: `render.mjs server.mjs comp.js comp.css index.html lib.js` (Engine agent), `fx.js fx.css` (FX agent), `synth.mjs` (Audio agent).
- `briefing/scenes/s1..s7.js`, `trailer/scenes/t1..t10.js`, each cut's `audio.mjs`.
- Each file has one owner. Write only your own files. Do not touch anything outside this output folder; never edit `brag-output/` or `src/`. Do not run git. Do not install packages.

## Server routes (same origin, so iframes are scriptable)
`/__comp/*` = the active cut folder. `/engine/*` = `work/engine/`. Everything else = `work/site/` with index.html resolution.
Browser imports: `/__comp/timeline.js`, `/engine/lib.js`, `/engine/fx.js`. Each `timeline.js` re-exports `grid.js`.

## Scene module
`export async function mount(root)`: build DOM inside `root` (1920x1080 absolute, overflow hidden, charcoal). Resolves only when fully ready (iframes and fonts).
`export function seek(f)`: **f is an ABSOLUTE INTEGER FRAME.** Must be a pure function of f: safe in any order and repeatedly. No timers, Date, Math.random, rAF loops, or CSS transitions/animations.
Compare and branch on integer frames only; derive seconds only for easing. The shell shows the scene whose [start,end) contains f, and applies grain, scanlines and the cut flash over everything, so scenes don't add those.

## Rules
- Reuse the real site: real pages in iframes (`loadPage`), real markup, CSS, fonts. Rebuild only what can't be reused. Never click real buttons (`setCopied`); never touch the clipboard. Set inputs with `setInput`, which fires the real input event.
- Palette only: charcoal #141310, panel #1c1b17, ivory #efebe0, orange #ff4d00, rule #3f3b31, muted #aaa596. DM Sans (display 700, tight tracking) and mono uppercase labels. Radius 0. No shadows, no gradients except subtle vignette.
- Never on screen: `placeholder`, `Anonymous`, `Company AI Team`, `2023-06-16`, `WeBasic`, `@conditionalTestimonials`, browser chrome, localhost, emails, the word Kojima, any Metal Gear reference. Crop detail-page rails out.
- Readability: a line the viewer must read stays fully visible and settled at least 0.3s per word (9 frames per word), counted from when the whole line is on screen. Read-size minimum 34px at 1920; captions at least 56px.
- Every frozen frame must look good: no overflow, collisions, or low contrast. Hard cuts on bar/beat lines; no crossfades of busy layouts. Motion comes from slams, sweeps, typing, not from fading.
- No external network. Run from repo root so `@playwright/test` resolves; chromium falls back to /usr/bin/google-chrome.
- Verify your own work by rendering stills and looking at them. Report what you verified, and honestly note anything you couldn't.
