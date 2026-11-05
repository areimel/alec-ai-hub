# AI Hub spy-agency brag videos: storyboard and build plan

## Context

The existing square video (`brag-output/`) targets recruiters and developers, and stays untouched. This work adds a second campaign for **CEOs and executives who want to become AI power users**, built to make AI Hub feel cool and powerful. It has two cuts from the same material:

- **Cut A, The Briefing:** a full in-world classified briefing, addressed to the viewer.
- **Cut B, The Trailer:** big type, hard cuts and flashes of real UI.

Both are 1920×1080, 30fps, 20.8s, with a dark techno and acid bass score. Both use `/brag-slim`, and the catalog leads with business prompts before revealing the agents.

**Creative angle:** a secret agency's arsenal, except the agency hands it over for free. Everything builds to **DECLASSIFIED: Free to copy. No account.** The joke comes from the product itself, and the payoff is its real selling point.

## Shared direction

- **Palette:** Kojima only: charcoal `#141310`, ivory `#efebe0`, safety orange `#ff4d00`. DM Sans plus mono, zero radius, no shadows.
- **Added FX:** scanlines, film grain, HUD corner brackets, redaction bars, rubber stamps, glitch slices and an animated radar sweep on the real plate.
- **Nothing borrowed:** no Metal Gear names, logos or sounds, and "Kojima" never appears on screen.
- **Truth rule:**
  - Fictional agency labels are styling only: DIRECTOR, ACCESS GRANTED, MISSION 01, DECLASSIFIED.
  - Product claims and counts are real and read from the built site: 18 prompts, 5 agents, 4 skills and plugins, free, no account.
  - Real site copy used: "PROMPT RESEARCH BUREAU", "Working tools. Yours to copy.", "Find it, fill it in, copy it.", the Access values and the agent names.
  - Typed form values are visibly sample inputs.
- **Music:** 138.46 BPM (beat = exactly 13 frames, bar = 52 frames = 1.733s), A Phrygian.
  - Thick 303-style acid bass: saw/square through a resonant filter with accents and slides, tanh drive and a sine sub layer.
  - Rumble kick, offbeat hats, dark clap, a minor stab and sidechain pumping.
  - Effects are in key and on the grid. Written in pure Node with no new packages, mastered to about -14 LUFS.

## Storyboard: Cut A, The Briefing

Times are frames, then seconds. Every cut is on a bar line.

| # | Frames / time | Bars | Picture | On-screen text | Sound |
|---|---|---|---|---|---|
| 1 Hook | 0-104 / 0-3.47s | 1-2 | Charcoal screen with scanlines and HUD brackets. A file header types on and a redaction bar wipes off the reveal line. Orange **ACCESS GRANTED** stamp slams on bar 2. | `AI HUB / PROMPT RESEARCH BUREAU` (small), **"Director. Your clearance is approved."** | Filtered acid and rumble, no kick; stamp hit on bar 2 |
| 2 Reveal | 104-208 / 3.47-6.93s | 3-4 | Real orange radar plate slams in with the sweep rotating, beside the real hero. The real stat strip counts up to 18 / 5 / 4. | "Working tools. Yours to copy." / **"AI prompts, custom agents and skills."** | **Drop:** full kick and bass |
| 3 Find | 208-260 / 6.93-8.67s | 5 | Real `/prompts` search types "marketing", narrowing 18 to 3 cards. A target lock snaps onto Marketing Email Template Generator. | `MISSION 01` / **"Find it."** | Acid opens; one tick per typed letter on the 16th grid |
| 4 Fill and copy | 260-364 / 8.67-12.13s | 6-7 | Split screen of the same real page: fields on the left, prompt text on the right. Typing makes the `@` blanks resolve in the prompt, like decryption. The real Copy prompt button flips to **Copied** at f338, then `MISSION READY`. | **"Fill it in. The prompt updates as you type."** | Filter climbing; hit on Copy |
| 5 Operatives | 364-468 / 12.13-15.6s | 8-9 | Five real agent cards land one per beat with barcode and real Access value: Bug Investigator and Code Reviewer (Runs commands), Codebase Explorer (Read-only), Docs Writer and Test Writer (Can edit). | **"Then deploy the specialists. Five custom agents for Claude Code."** | Acid peak; a stab on each card |
| 6 Declassified | 468-520 / 15.6-17.33s | 10 | Hard cut. Redaction bars tear off the plates and a huge **DECLASSIFIED** stamp lands. | **"Free to copy. No account."** | Breakdown: kick drops out, one impact |
| 7 Outro | 520-624 / 17.33-20.8s | 11-12 | Real AI HUB plate with the URL large, radar still sweeping, then HUD lines cut out. | **ai-hub.alecreimel.com**, "Free to copy. No account.", "By Alec Reimel" | Final drop, last bass hit and tail |

Durations: 104+104+52+104+104+52+104 = 624 frames.

## Storyboard: Cut B, The Trailer

Hard cuts and flash frames throughout, using the same palette and real assets.

| # | Frames / time | Bars | Picture | On-screen text | Sound |
|---|---|---|---|---|---|
| 1 | 0-52 / 0-1.73s | 1 | Black, huge ivory type slams on frame 0 | **EVERYONE HAS AI.** | Impact, then acid alone |
| 2 | 52-104 / 1.73-3.47s | 2 | Hard cut to an orange field | **FEW COMMAND IT.** | Riser, acid opening |
| 3 | 104-130 / 3.47-4.33s | 3 (beats 1-2) | Full-bleed real radar plate, AI HUB wordmark slam | AI HUB | **Drop** |
| 4 | 130-208 / 4.33-6.93s | 3-4 | Giant numerals land on beats, stacked | **18 PROMPTS / 5 CUSTOM AGENTS / 4 SKILLS & PLUGINS** | Hit on each |
| 5 | 208-260 / 6.93-8.67s | 5 | Real search slamming to 3 results, target lock | **FIND IT.** | Typing ticks |
| 6 | 260-312 / 8.67-10.4s | 6 | Extreme close-up of real prompt text as `@` blanks resolve | **FILL IT IN.** | Acid squelch |
| 7 | 312-364 / 10.4-12.13s | 7 | Oversized real Copy prompt button flips to Copied, white flash | **COPY IT.** | Hit |
| 8 | 364-468 / 12.13-15.6s | 8-9 | Real agent names stack one per beat with their real Access labels | Kicker `CUSTOM AGENTS FOR CLAUDE CODE`; BUG INVESTIGATOR, CODE REVIEWER, CODEBASE EXPLORER, DOCS WRITER, TEST WRITER | Acid peak |
| 9 | 468-520 / 15.6-17.33s | 10 | Near-silent black, then a stamp | **FREE. NO ACCOUNT.** | Everything cuts, one impact |
| 10 | 520-624 / 17.33-20.8s | 11-12 | AI HUB plate slam, URL | **YOURS TO COPY.** / **ai-hub.alecreimel.com** / By Alec Reimel | Final drop and tail |

Durations: 52+52+26+78+52+52+52+104+52+104 = 624 frames. Cut B has its own arrangement on the same synth engine, opening harder than A.

**Draft share copy:**
- A: "Director, your clearance is approved. AI Hub is a free arsenal of working AI prompts, plus custom agents for Claude Code. Free to copy, no account: ai-hub.alecreimel.com"
- B: "Everyone has AI. Few command it. Free prompts, custom agents and skills, no account: ai-hub.alecreimel.com"

## Content kept out of frame

The site itself isn't changed. Shots are framed to avoid these, and each one can be fixed separately:

- **`placeholder` tag and "Anonymous" author** on business prompts: both appear only on detail pages, and cards show just the first 3 tags. We film the cards, not those pages.
- **Marketing Email page rail** (author "Company AI Team", date 2023-06-16): crop to the main column.
- **"WeBasic  Developer" typo** in `src/content/prompts/web-developer.mdx`: the "marketing" search filters it out. Never shown.
- **`@conditionalTestimonials`** stays an unfilled token: framed out.
- **Forms and URL bar:** no form submissions or browser chrome.

## Build

**Location:** new sibling folder `brag-output-2026-11-05-HHmmss/` (real time at build). `brag-output/` isn't edited.

```
brag-plan.md, share-copy.txt
brag-briefing.mp4/.jpg, brag-trailer.mp4/.jpg
.gitignore  (site/, stills/, stems/, frames/, *.wav, noaudio mp4: local only, keeps the repo light)
work/
  engine/   render.mjs, server.mjs, lib.js, comp.js, comp.css, index.html, fx.js, synth.mjs
  site/     fresh `pnpm build` copy (the old copy has 4 agents, the source has 5)
  briefing/ timeline.js, scenes/, audio.mjs
  trailer/  timeline.js, scenes/, audio.mjs
```

**Reuse, adapted from `brag-output/work/`:**
- `render.mjs`: parametrize `--cut`, viewport, frame count, output names and contact sheet; add parallel page workers over frame ranges.
- `server.mjs`: serve `/__comp` from the cut folder, `/__engine` from the engine, and `/` from `site/`.
- `lib.js`: `loadPage`, `setInput`, `setCopied`, `createCursor`, plus `typedCount` from `timeline.js`.
- `audio.mjs`: mix, reverb, sidechain and mastering primitives move to `synth.mjs`.

**Key technical rules:**
- **Timing is integer frames only:** `BEAT = 13` frames, samples = frame × 1600 (`beat = 20800`, total `998400`). Typing uses `floor(n*13/4)` in both picture and sound.
- **Seek by frame number,** so float rounding can't move a scene boundary.
- **Real selectors:**
  - Template page: `#var-<name>`, `#promptContent`, `#copyPrompt`.
  - Cards: `.prompt-card__*`.
  - Hero: `.home-hero__plate`, `.stat-strip`.
  - Radar: `.home-hero__plate path[d^="M245 277"]`, rotated about (245, 277).
- **Split-screen shot:** two synced iframes of the same page, since fields and prompt text don't fit in one 1080-tall view.
- **Pure functions of time:** grain is a pre-built tile offset per frame, not `feTurbulence`. No timers or `Math.random`.

## TODO and subagent assignments (9 of the allowed 12)

| Agent | Model | Tasks |
|---|---|---|
| Lead (me) | Opus | Contract, timelines, integration, review of every still, commits, delivery |
| Facts | Haiku | Fresh build and copy of site; `facts.json` with real counts, Access values, selectors; assert excluded strings stay out of frame |
| Engine | Sonnet | Adapt render, server and shell for two cuts; parallel rendering; determinism check |
| FX | Sonnet | `fx.js`: scanlines, grain, brackets, redaction, stamp, glitch, radar sweep, target lock |
| Audio | Sonnet | `synth.mjs` with the acid bass; both arrangements to stems and masters |
| Briefing 1 | Sonnet | Cut A scenes 1, 2, 6, 7 |
| Briefing 2 | Sonnet | Cut A scenes 3, 4, 5 |
| Trailer | Sonnet | All Cut B scenes |
| Audio QA | Haiku | Measure LUFS and peaks, onset-to-grid check, duration and sample count |
| Visual QA | Sonnet | Fresh-eyes critique of contact sheets and mid-transition stills, without seeing my reasoning |

## Commits (on `media/brag-video`, not pushed)

1. Approved plan, storyboard, folder scaffold and fresh site copy setup
2. Shared engine and FX library, with test stills passing
3. Acid techno synth and both arrangements
4. Cut A scenes, rendered
5. Cut B scenes, rendered
6. QA fixes, posters baked in as frame 0, share copy, final deliverables

## Verification

- `ffprobe` on each mp4: 1920×1080, 30fps, 624 frames, 20.8s, AAC audio.
- Determinism: same frame hash when seeking out of order.
- Audio: about -14 LUFS, no clipping, kicks on the grid, measured with ffmpeg `ebur128`/`astats`.
- Stills from every scene and mid-transition: no overflow, collisions or low contrast; 0.3s per word readable.
- DOM assertion during render: `placeholder`, `Anonymous`, `Company AI Team` and `WeBasic` are not visible in any shot.
- Poster is a settled frame baked in as frame 0, with duration and sync unchanged.
- `git diff --stat main...HEAD -- brag-output/` is unchanged by these commits, and `src/` isn't modified.
- Watch both final videos' stills and report anything that couldn't be verified by eye or ear; final sound judgment is yours.
