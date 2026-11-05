---
draft: false
title: "Incident Postmortem Writer"
description: "A skill that turns incident notes and logs into a blameless postmortem with a timeline, impact, root cause and action items with owners."
usage_instructions: "Save as .claude/skills/incident-postmortem-writer/SKILL.md in a project, or ~/.claude/skills/incident-postmortem-writer/SKILL.md for all projects, then run /incident-postmortem-writer or just paste your incident notes and ask Claude to write a postmortem."
category: "Docs"
sub_category: "Skill"
tags: ["incident", "postmortem", "documentation", "reliability"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
---
name: incident-postmortem-writer
description: "Writes a blameless incident postmortem with timeline, impact, root cause, and action items with owners. Marks unknown facts as unknown. Use when the user asks for a postmortem, incident report, or write-up of an outage."
allowed-tools: Read Glob Grep
---

# Incident Postmortem Writer

## Before writing
1. Read everything the user supplied: chat logs, notes, alerts, and any files they named.
2. Build the timeline only from timestamps and events that appear in those sources.
3. Separate what is known from what is assumed. Write down what is still unknown.
4. If there is no root cause yet, say so; do not pick the likeliest one.

## Format
- **Summary**: two or three sentences on what happened and how it ended.
- **Impact**: who or what was affected and for how long. Use only figures from the sources.
- **Timeline**: one line per event, with time and timezone, in order.
- **Root cause**: the conditions that allowed the failure, described in terms of systems and process, not people.
- **What went well / what went poorly**: short bullets.
- **Action items**: each with an owner and a due date. If either is not given, write `Owner: unassigned` or `Due: not set`.
- **Unknowns**: facts the sources do not establish, marked `Unknown: ...`.

## Example
```
Summary: The checkout page returned errors for part of an afternoon
after a config change. It was fixed by rolling the change back.

Impact: Unknown: number of failed orders. Duration: 14:05-14:52 UTC.

Timeline:
- 14:05 UTC: Config change deployed
- 14:12 UTC: Error alert fired
- 14:52 UTC: Rollback completed

Root cause: The config change had no validation step, so an invalid
value reached production.

Action items:
- Add config validation to the deploy pipeline. Owner: unassigned. Due: not set.
```

## Never
- Blame an individual or name one as the cause. Describe the system and the process.
- Invent times, durations, customer counts, or causes.
- Present a guess as the root cause.
- Leave an action item without an owner field, even when the owner is unknown.
