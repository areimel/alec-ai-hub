# DIY Prompt Library: conversion landing page

## Intent
`/diy-prompt-library` was a short informational page (hero, feature grid, "what open source means", FAQ, contact). It had no clear conversion path. It becomes a marketing page for **teams and businesses** with **two paths split by audience**:

- **Do it yourself (free):** fork or download the MIT-licensed code from GitHub.
- **Done for you (custom quote):** Alec deploys and brands the library on the team's host, writes custom prompts/agents/skills for their workflows, and trains the team. No ongoing maintenance offered. No prices shown; every quote goes through the contact form.

Success: a business visitor understands the value in the hero, sees the product, picks a path, and either requests a quote or forks the repo.

## Goals / non-goals / anti-goals
- Goals: one clear primary CTA (request a quote) and one clear secondary (get the code free); outcome-led copy; real product screenshots; real counts.
- Non-goals: pricing, tiers, ongoing maintenance, new routes, nav changes.
- Anti-goals: inflated claims ("trusted by thousands", fake logos, fake testimonials, invented numbers); ambient animation; breaking the homepage.

## Approaches considered
1. **New DIY section components (picked).** `src/components/DiyComponents/` + `src/styles/hub/diy.css`; reuse `LandingHero`, `LandingFeatures`, `LandingPanel`, `LandingContact`, `SectionHead`, `ActionButton`, `InstrumentGraphic`. Homepage untouched.
2. Variants on the Landing components: more sharing, but every change risks the homepage.
3. One page file: fastest, but > 400 lines and not reusable.

## Visual direction
Bolder, inside Kojima: same tokens (`kojima.css`), DM Sans display, mono technical labels, radius 0, no shadows, ruled grids, plates and registration marks. The emphasized done-for-you card uses the safety-orange rule and label. Hover/focus states only, no ambient motion. Legibility floor: readable text >= 12px labels, >= 14px body.

## Page structure
1. Hero (`LandingHero`): primary "Request a quote" → `#contact`, secondary "Get the code free" → `#paths`. Stats strip = live counts of published prompts / agents / skills from `getPublished()` + license "MIT".
2. Problem → outcome (`DiyProblem`): ruled before/after rows.
3. Product preview (`DiyPreview`): two framed real screenshots (directory + prompt detail), captured by `scripts/capture-diy-previews.mjs`, stored in `src/assets/diy/`, rendered with Astro `<Image>`.
4. Two paths (`DiyPaths`, `id="paths"`): DIY card vs done-for-you card (emphasized).
5. How setup works (`DiyTimeline`): 4 numbered service steps, each with a one-line DIY equivalent.
6. What's included (`LandingFeatures`).
7. Service detail (`LandingPanel` + plate).
8. FAQ + contact (`LandingContact`): FAQ for business objections; form gets a hidden subject and a "What do you need?" select.
9. Final CTA band (`DiyCtaBand`).

## Content contract: `src/data/diyPromptLibrary.json`
```jsonc
{
  "hero": { "kicker", "headline", "headlineMuted", "intro",
            "primary": { "text", "href": "#contact" },
            "secondary": { "text", "href": "#paths" } },
  "statsLabels": { "prompts", "agents", "skills", "license" },   // values come from build-time counts; license value "MIT"
  "problem": { "header": { "label", "title" },
               "rows": [{ "before", "after" }] },               // 3 rows
  "preview": { "header": { "label", "title" },
               "shots": [{ "key": "directory" | "detail", "caption", "code", "alt" }] },
  "paths": { "header": { "label", "title", "description" },
             "diy":     { "label", "title", "price", "description", "items": [string],
                          "primary": { "text", "href" }, "secondary": { "text", "href" } },
             "service": { "label", "title", "price", "description", "items": [string],
                          "primary": { "text", "href": "#contact" }, "note" } },
  "timeline": { "header": { "label", "title" },
                "steps": [{ "title", "description", "diy" }] },  // 4 steps
  "features": { "header": { "label", "title" }, "items": [{ "title", "description" }] },
  "service":  { "label", "headline", "paragraphs": [string], "button": { "text", "href": "#contact" } },
  "faq":      { "header": { "label", "title" }, "items": [{ "id", "question", "answer" }] },
  "contact":  { "header": { "label", "title", "description" },
                "subject": string,
                "interest": { "label", "options": [string] } },
  "ctaBand":  { "label", "headline", "headlineMuted", "description",
                "primary": { "text", "href": "#contact" }, "secondary": { "text", "href": "#paths" } }
}
```
Links: GitHub `https://github.com/areimel/alec-ai-hub`, ZIP `https://github.com/areimel/alec-ai-hub/archive/main.zip`.

## Contact form
`contactform.astro` takes optional `subject` (hidden `subject` input for web3forms) and optional `interest: { label, options }` (rendered as a select). Omitted props render the form exactly as today, so the homepage is unchanged.

## Left to the builder
Exact spacing, breakpoints and component internals, within the tokens above. Each new file < 300 lines.
