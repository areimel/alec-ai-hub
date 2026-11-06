---
draft: false
title: "Decision Memo Writer"
description: "A skill that turns your notes into a one-page decision memo with options, trade-offs, a recommendation, an owner and a deadline."
usage_instructions: "Save as .claude/skills/decision-memo-writer/SKILL.md in a project, or ~/.claude/skills/decision-memo-writer/SKILL.md for all projects, then run /decision-memo-writer or just paste your notes and ask Claude to write a decision memo."
category: "Writing"
sub_category: "Skill"
tags: ["memo", "decisions", "writing", "leadership"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 09:00"
lastUpdated: "2026-11-05 09:00"
featured: false
---
---
name: decision-memo-writer
description: "Turns notes into a one-page decision memo: the decision, options, trade-offs, recommendation, owner and deadline. Flags missing facts instead of inventing them. Use when the user asks for a decision memo, decision brief, or to frame a choice for approval."
---

# Decision Memo Writer

## Before writing
1. Read everything the user supplied. If they named a file, read that file.
2. Pull out the decision to be made, the options mentioned, the facts about each, who decides, and any deadline.
3. List what is missing: cost, effort, risk, owner, date, who is affected. Do not fill gaps with guesses.
4. If the decision itself is unclear, ask one short question before drafting.

## Format
Keep it to one page.
- **Decision needed**: one sentence, phrased as a question.
- **Context**: 2-4 sentences on why this is being decided now.
- **Options**: each option with a one-line description, then its pros and cons as short bullets.
- **Recommendation**: the option you would pick and the reason. If the notes do not support a recommendation, say so.
- **Owner and deadline**: who decides, and by when.
- **Open questions**: facts the notes did not give, marked `[Missing: ...]`.

## Example
```
Decision needed: Do we move support tickets to the new help desk this quarter?

Context: The current tool's contract renews in January. The team has
trialed the new one for two weeks.

Options:
A. Switch now
 - Pro: avoids renewing the old contract
 - Con: [Missing: migration effort]
B. Renew and revisit next year
 - Pro: no disruption
 - Con: pays for the old tool another year

Recommendation: A, if migration effort is acceptable. Notes do not say.

Owner and deadline: Dana to decide; renewal notice is due [Missing: date].
```

## Never
- Invent costs, dates, names, or numbers that are not in the notes.
- Present a recommendation as certain when facts are missing.
- Hide a weak option by leaving out its downsides.
- Run past one page; cut context before cutting trade-offs.
