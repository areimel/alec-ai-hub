---
draft: false
title: "Commit Message Writer"
description: "A skill that reads your staged changes and writes a commit message explaining why the change was made."
usage_instructions: "Save as .claude/skills/commit-message-writer/SKILL.md in a project, or ~/.claude/skills/commit-message-writer/SKILL.md for all projects, then run /commit-message-writer or just ask Claude to write a commit message."
category: "Writing"
sub_category: "Skill"
tags: ["git", "commits", "writing", "workflow"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-03 12:00"
lastUpdated: "2026-11-03 12:00"
featured: false
---
---
name: commit-message-writer
description: "Writes a git commit message from the actual staged diff, focused on why the change was made. Use when the user asks for a commit message, wants to commit, or asks to summarize staged changes."
allowed-tools: Bash(git status:*) Bash(git diff:*) Bash(git log:*)
---

# Commit Message Writer

## Before writing
1. Run `git status --short` to see what is staged.
2. Run `git diff --staged` and read all of it. If nothing is staged, say so and ask; do not guess from unstaged work.
3. Run `git log -n 10 --oneline` to match the repo's existing style (prefixes, tense, casing).

## Format
- Subject: imperative mood, 50 characters or fewer, no trailing period.
- Blank line, then a body wrapped near 72 columns, only if the change needs explaining.
- The body says why: the problem, the reason for this approach, and anything a reviewer might wonder about. The diff already shows what.
- Use a Conventional Commits prefix (`fix:`, `feat:`) only if the recent log does.

## Example
```
Retry webhook delivery on 5xx responses

Partners reported missed events during their deploy windows. A single
failed attempt dropped the event, so retry up to three times with
backoff before giving up.
```

## Never
- Describe changes that are not in the staged diff.
- Restate the diff line by line ("changed X to Y").
- Use vague subjects like "fix bug" or "updates".
- Run `git commit` unless the user asked you to commit.
