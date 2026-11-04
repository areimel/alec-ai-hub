---
draft: false
title: "Changelog Writer"
description: "A skill that turns the git history since the last release into a changelog entry grouped by what users will notice."
usage_instructions: "Save as .claude/skills/changelog-writer/SKILL.md in a project, or ~/.claude/skills/changelog-writer/SKILL.md for all projects, then run /changelog-writer or just ask Claude to draft release notes."
category: "Docs"
sub_category: "Skill"
tags: ["git", "changelog", "release-notes", "docs"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-03 12:00"
lastUpdated: "2026-11-03 12:00"
featured: false
---
---
name: changelog-writer
description: "Drafts a changelog entry from git history since the last tag, grouped by user-visible impact. Use when the user asks for a changelog, release notes, or what changed since the last release."
allowed-tools: Bash(git log:*) Bash(git describe:*) Bash(git show:*) Bash(git diff:*)
---

# Changelog Writer

## Before writing
1. Find the last release: `git describe --tags --abbrev=0`. If there are no tags, ask which commit to start from.
2. Run `git log <tag>..HEAD --no-merges --format="%h %s%n%b"`.
3. For any commit whose message is unclear, check `git show --stat <hash>` before describing it.
4. Read the existing CHANGELOG file, if any, and copy its style and heading format.

## Format
- Group by impact on users: **Added**, **Changed**, **Fixed**, **Removed**. Add **Security** or **Breaking** when relevant, listed first.
- One line per item, written from the user's point of view ("Exports no longer time out on large projects").
- Skip internal noise: refactors, dependency bumps, CI tweaks, formatting, test-only changes. Include a bump only if it fixes something users hit.
- Merge related commits into one item.

## Example
```
## 1.4.0 - 2026-11-03
### Added
- CSV export for the reports page
### Fixed
- Login no longer fails when the email contains a plus sign
```

## Never
- Invent entries that no commit supports.
- Copy commit subjects verbatim when they read as developer shorthand.
- Include commit hashes or author names unless the existing changelog does.
- Guess the version number or date; ask if they are not given.
