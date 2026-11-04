---
draft: false
title: "PR Description Writer"
description: "A skill that reads the branch's commits and diff and writes a pull request description a reviewer can act on."
usage_instructions: "Save as .claude/skills/pr-description-writer/SKILL.md in a project, or ~/.claude/skills/pr-description-writer/SKILL.md for all projects, then run /pr-description-writer or just ask Claude to write a PR description."
category: "Writing"
sub_category: "Skill"
tags: ["git", "pull-requests", "writing", "review"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-03 12:00"
lastUpdated: "2026-11-03 12:00"
featured: false
---
---
name: pr-description-writer
description: "Writes a pull request title and description from the branch's real commits and diff. Use when the user asks for a PR description, PR summary, or is about to open a pull request."
allowed-tools: Bash(git log:*) Bash(git diff:*) Bash(git status:*) Bash(git merge-base:*) Bash(git branch -a)
---

# PR Description Writer

## Before writing
1. Find the base branch (usually `main`): `git branch -a`, then `git merge-base HEAD main`.
2. Run `git log --oneline <base>..HEAD` to see every commit on the branch.
3. Run `git diff <base>...HEAD --stat`, then read the full diff for the files that matter.

## Format
- Title: under 70 characters, imperative, describes the outcome.
- **Summary**: 1-3 sentences on what changed and why.
- **Changes**: a short bullet list grouped by area, not by commit.
- **Testing**: how it was verified. Only list checks that were actually run; otherwise write what a reviewer should try.
- **Notes for reviewers**: risky spots, migrations, follow-ups. Omit the section if empty.

## Example
```
Title: Cache rate-limit lookups per request

Summary: Rate-limit checks hit the database up to four times per request.
This reads the limit once and reuses it.

Changes:
- Add request-scoped cache in middleware/limits.ts
- Remove duplicate lookups in the upload and export handlers

Testing: Ran the unit suite; added a test for cache reuse.
```

## Never
- Mention files or behavior not present in the diff.
- Claim tests pass unless you saw them pass.
- Paste the raw commit list as the description.
- Pad with praise or filler ("this PR greatly improves...").
