---
draft: false
title: "Git Worktree Workflow"
description: "Add-on that has Claude Code do the update in its own git worktree, then commit, merge, and clean up the worktree when done."
usage_instructions: "1. Write your normal Claude Code request.
2. Paste this prompt at the end of it.
3. The worktree branches off whatever branch you are currently on, so check out the right branch first."
category: "Coding"
sub_category: "Claude"
template: false
tags: ["claude-code","add-on","git","worktree","branching"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-13 09:00"
lastUpdated: "2026-11-13 09:00"
featured: false
---
I want you to open a new git worktree for this update. When the update is complete, I want you to use git commands to properly commit, merge the changes, and close out the worktree. The worktree should branch off of the branch we're currently working on.
