---
draft: false
title: "Git Writing Kit"
description: "A local Claude Code plugin that bundles the commit message, PR description, and changelog writing skills."
usage_instructions: "This plugin is not on a marketplace. Assemble the folder by hand from the structure below, validate it with `claude plugin validate ./git-writing-kit`, then load it with `claude --plugin-dir ./git-writing-kit`."
category: "Workflow"
sub_category: "Plugin"
tags: ["git", "plugin", "commits", "pull-requests", "changelog"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-03 12:00"
lastUpdated: "2026-11-03 12:00"
featured: false
---
Git Writing Kit bundles three skills from this site into one Claude Code plugin. It is not published on a marketplace. You assemble it by hand and load it locally.

DIRECTORY STRUCTURE

git-writing-kit/
  .claude-plugin/
    plugin.json
  skills/
    commit-message-writer/
      SKILL.md
    pr-description-writer/
      SKILL.md
    changelog-writer/
      SKILL.md

Only plugin.json goes inside .claude-plugin/. The skills folder sits at the plugin root, next to it.

STEP 1: CREATE plugin.json

Save this as git-writing-kit/.claude-plugin/plugin.json:

{
  "name": "git-writing-kit",
  "description": "Skills for writing commit messages, pull request descriptions, and changelogs from the real git history.",
  "version": "1.0.0",
  "author": {
    "name": "Alec Reimel"
  }
}

STEP 2: ADD THE THREE SKILLS

Copy each skill from this site and save its body as the SKILL.md at the path shown:

- /skills-plugins/commit-message-writer  ->  git-writing-kit/skills/commit-message-writer/SKILL.md
- /skills-plugins/pr-description-writer  ->  git-writing-kit/skills/pr-description-writer/SKILL.md
- /skills-plugins/changelog-writer       ->  git-writing-kit/skills/changelog-writer/SKILL.md

Each SKILL.md must begin with the --- line on its first line.

STEP 3: VALIDATE

claude plugin validate ./git-writing-kit

STEP 4: LOAD IT LOCALLY

claude --plugin-dir ./git-writing-kit

STEP 5: USE IT

Plugin skills are namespaced by the plugin name. Run:

/git-writing-kit:commit-message-writer

Likewise /git-writing-kit:pr-description-writer and /git-writing-kit:changelog-writer. Claude may also load them automatically when your request matches a skill's description.
