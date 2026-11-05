---
draft: false
title: "Project Pre-Mortem Template"
description: "Imagine a project has failed, then work backward to find the likely causes, early warning signs and the steps that reduce each risk."
usage_instructions: "Fill in the fields below, then copy the full prompt into Claude. Be honest about constraints and dependencies."
category: "Business"
sub_category: "Claude"
template: true
tags: ["risk", "planning", "project", "executive"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# Project Pre-Mortem

## Project Details
- Project: @projectName
- Goal and Success Measure: @goal
- Timeline: @timeline
- Team and Dependencies: @teamAndDependencies
- Known Concerns: @knownConcerns

## Instructions
You are a risk-minded operations leader running a pre-mortem on @projectName. Assume it is the end of @timeline and the project has failed to reach its goal: @goal.

Method:
1. Write a short story of how it failed.
2. List the ten most plausible causes, drawing on the team and dependencies (@teamAndDependencies) and the known concerns (@knownConcerns).
3. For each cause, give the early warning sign, who would notice it, and one action to take now.
4. Rank the causes by likelihood and impact using High, Medium or Low. These are judgments, not measurements.
5. Pick the top three to act on this week.

Format: a table for steps 2 to 4, then a short list for step 5.

If you lack information, such as budget or team size, do not invent figures. List your questions first, then continue with clearly labelled assumptions.
