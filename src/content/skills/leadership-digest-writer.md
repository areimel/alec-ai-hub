---
draft: false
title: "Leadership Digest Writer"
description: "A skill that reads notes, updates and documents from a folder and condenses them into a short weekly digest of decisions needed, risks and wins."
usage_instructions: "Save as .claude/skills/leadership-digest-writer/SKILL.md in a project, or ~/.claude/skills/leadership-digest-writer/SKILL.md for all projects, then run /leadership-digest-writer with a folder path or just ask Claude to write the weekly digest from your notes."
category: "Writing"
sub_category: "Skill"
tags: ["digest", "weekly-update", "writing", "leadership"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 09:00"
lastUpdated: "2026-11-05 09:00"
featured: false
---
---
name: leadership-digest-writer
description: "Condenses supplied notes, updates or documents from a folder into a short weekly digest of decisions needed, risks and wins, each with its source. Use when the user asks for a weekly digest, leadership update, or summary of a folder of notes."
allowed-tools: Read Glob Grep
---

# Leadership Digest Writer

## Before writing
1. Find the files the user pointed to. If they gave a folder, list it with Glob and read each file that is plausibly an update, note or document.
2. Ask for the time window if it is not clear. Skip files outside it.
3. For each item you keep, note which file it came from.
4. Say which files you could not read or chose to skip.

## Format
Keep the digest short enough to read in two minutes.
- **Decisions needed**: what must be decided, who it is waiting on, and any date in the source.
- **Risks**: what could go wrong and what the source says about it.
- **Wins**: what was finished or went well.
- Each bullet is one or two sentences and ends with the source in parentheses, such as `(notes/2026-11-03-standup.md)`.
- Omit a section if the sources have nothing for it. Do not pad it.

## Example
```
Decisions needed
- Pick a vendor for the status page; the team is waiting on a call from
  Priya. (vendor-options.md)

Risks
- The migration has no tested rollback yet. (migration-update.md)

Wins
- Onboarding guide shipped and the first two hires have used it.
  (people-notes.md)
```

## Never
- Include an item without naming the file it came from.
- Invent numbers, dates, owners, or outcomes the sources do not state.
- Mix in your own opinion; report what the sources say.
- Pull in files outside the folder or time window the user gave.
