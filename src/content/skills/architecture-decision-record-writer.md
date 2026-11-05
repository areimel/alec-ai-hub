---
draft: false
title: "Architecture Decision Record Writer"
description: "A skill that writes an architecture decision record from the code and your discussion, following the numbering of any existing ADR folder."
usage_instructions: "Save as .claude/skills/architecture-decision-record-writer/SKILL.md in a project, or ~/.claude/skills/architecture-decision-record-writer/SKILL.md for all projects, then run /architecture-decision-record-writer or just ask Claude to write an ADR for a decision."
category: "Docs"
sub_category: "Skill"
tags: ["adr", "architecture", "documentation", "decisions"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
---
name: architecture-decision-record-writer
description: "Writes an architecture decision record (context, decision, consequences, alternatives) from the code and the discussion, matching any existing ADR folder's numbering and style. Use when the user asks for an ADR or wants to document an architecture decision."
allowed-tools: Read Glob Grep Write
---

# Architecture Decision Record Writer

## Before writing
1. Look for an existing ADR folder with Glob (`docs/adr`, `docs/adrs`, `docs/decisions`, `adr`, `doc/architecture/decisions`).
2. If one exists, read the newest ADR and one older one. Match their template, headings and filename style, and use the next number.
3. If none exists, use `docs/adr/0001-short-title.md` and tell the user you chose that.
4. Read the code involved with Read and Grep, plus any discussion the user pasted, so the record reflects what is actually there.
5. If the decision, or why it was made, is not in the code or the discussion, ask. Do not guess.

## Format
- **Title**: `ADR NNNN: <decision in a short phrase>`
- **Status**: Proposed, Accepted, or Superseded by ADR NNNN. Use Proposed unless the user says it is accepted.
- **Context**: the problem and the constraints, in a short paragraph.
- **Decision**: what was chosen, in active voice ("We will use...").
- **Consequences**: what gets easier, what gets harder, and what must change. Include the downsides.
- **Alternatives considered**: each option and the reason it was not chosen.

## Example
```
# ADR 0007: Use a job queue for report generation

Status: Proposed

Context: Report exports run inside the request and time out on large
accounts (see exports/service.ts).

Decision: We will move report generation to a background queue and
notify the user when it finishes.

Consequences:
- Requests return quickly.
- We now run and monitor a queue worker.
- Users no longer get the file immediately.

Alternatives considered:
- Raise the request timeout: does not fix the cause.
- Pre-generate nightly: reports would be stale.
```

## Never
- Invent alternatives, constraints, or reasons that no one stated.
- Rewrite or renumber existing ADRs. If a decision replaces one, mark the old one superseded only if the user asks.
- Mark a decision Accepted without being told so.
- Leave out the downsides in Consequences.
