# Composition contract (all subagents read this)

Layout of `work/`:
- `timeline.js`  timing and colours. Never edit; ask the lead. Never hard-code a time that exists there.
- `lib.js`       deterministic browser helpers (loadPage, setInput, setCopied, createCursor, createCaption, ramp...). Never edit; ask the lead.
- `site/`        real built site. Treat as read-only.
- `server.mjs`, `index.html`, `comp.js`, `comp.css`, `render.mjs` : owned by Sonnet A.
- `scenes/a.js`, `d.js`, `e.js` : Sonnet C. `scenes/b.js`, `c.js` : Sonnet B.
- `audio.mjs`, `audio.wav` : Sonnet D.

Server: `node work/server.mjs [port]`. `/__comp/*` serves work/ (so `/__comp/index.html`, `/__comp/timeline.js`);
all other paths serve work/site/ with index.html resolution (the site uses root-absolute URLs). Same origin, so iframes are scriptable.

Scene module: `scenes/<id>.js` exports
- `async mount(root)` : build DOM inside `root` (absolutely-positioned 1080x1080 div, overflow hidden, charcoal background). Load iframes with `loadPage`. Must resolve only once fully ready.
- `seek(t)` : `t` is ABSOLUTE seconds (same numbers as timeline.js). Must be a pure function of t, safe in any order and repeatedly, with no timers, Date, Math.random, rAF loops or CSS transitions/animations. Everything visible derives from t.

Shell: mounts all scenes up front, shows only the scene whose range contains t, calls its `seek(t)`, and applies the charcoal dip (timeline `DIP`) around cuts. Scenes don't do their own cut fades.

Rules
- Reuse the real site: real pages in iframes and real markup copied from the built pages, real CSS (`/_astro/*.css`), real DM Sans (`/fonts/dm-sans/*`). Rebuild only what can't be reused.
- Never click real buttons; use `setCopied`. Never call the clipboard.
- Read counts from the built DOM, never hard-code them.
- Readability: a line stays fully visible and settled at least 0.3s per word, counted from the moment the whole line is on screen.
- Every frozen frame should look good: no overflow, collisions or low contrast. Legible on a phone: captions at least 44px, nothing a viewer must read under about 26px.
- No external network requests. No install of any package. Write only your own files. Do not touch anything outside `brag-output/work/`. Do not run git.
- Run scripts from the repo root; ESM resolves `@playwright/test` from the repo's node_modules.
