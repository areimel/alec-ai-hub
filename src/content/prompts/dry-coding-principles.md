---
draft: false
title: "DRY Coding Principles"
description: "Add-on that keeps Claude Code reusing components, extracting repeated elements, and keeping files under 300-400 lines."
usage_instructions: "1. Write your normal Claude Code request.
2. Paste this prompt at the end of it.
3. Works well on new features and refactors alike."
category: "Coding"
sub_category: "Claude"
template: false
tags: ["claude-code","add-on","dry","refactoring","components"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-13 09:00"
lastUpdated: "2026-11-13 09:00"
featured: false
---
Follow DRY (Don't Repeat Yourself) coding principles, reuse components where possible, and if any elements get repeated 3 or more times, consider breaking it out into a centralized reusable component. Try to keep files below 300-400 lines of code, and consider splitting them up into smaller files if they exceed that size. My intention for this is to reduce the amount of components and lines of code in our project, to keep the styling of the project more consistent, and to make it easier to work with and update.
