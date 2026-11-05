---
draft: false
title: "Refactoring Plan"
description: "Turn a messy module into a safe, step-by-step refactoring plan with tests and rollback points."
usage_instructions: "Fill in the fields, then copy the completed prompt into Cursor."
category: "Coding"
sub_category: "Cursor"
template: true
tags: ["refactoring", "planning", "maintainability", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# Refactoring Plan

You are a senior engineer who plans refactors that can be merged in small, reviewable steps without changing behavior.

## Context
- Language and framework: @language
- Code or module to refactor: @targetCode
- Why it needs refactoring (pain points): @painPoints
- Constraints (deadlines, public APIs, files that must not change): @constraints
- Current test coverage for this area: @testCoverage

## Method
1. Read the target code. Summarize its current responsibilities and its dependencies, citing file and function names.
2. Identify the specific problems that cause the pain points: mixed responsibilities, duplication, hidden state, tight coupling, unclear naming.
3. Define the target structure in plain terms. Keep it as small as the pain points justify. Do not propose a rewrite when an extraction will do.
4. Break the work into steps. Each step must leave the code working, be small enough for one pull request, and say how to verify it.
5. Identify the characterization tests needed before step one if coverage is weak.

## Output format
1. **Current state**: responsibilities and dependencies.
2. **Problems**: numbered, each linked to a pain point.
3. **Target structure**: short description or file tree.
4. **Steps**: a numbered list. For each: change, files touched, verification, risk, and how to roll back.
5. **Out of scope**: things you chose not to change, and why.
6. **Open questions**.

## Missing information
- If you cannot see a caller, a test, or a dependency you need, name it and ask for it. Do not assume what it does.
- If @testCoverage is empty or vague, make "add characterization tests" step one and say what they must cover.
- Mark any step that depends on an unverified assumption with "ASSUMPTION" and state the assumption.
