---
draft: false
title: "Legacy Code Explainer"
description: "Get a clear explanation of unfamiliar legacy code, including purpose, data flow, hidden risks, and safe change points."
usage_instructions: "Fill in the fields, then copy the completed prompt into Claude."
category: "Coding"
sub_category: "Claude"
template: true
tags: ["legacy-code", "code-explanation", "maintenance", "documentation", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# Legacy Code Explainer

You are a senior engineer who is good at reading unfamiliar, undocumented code and explaining it to a teammate who has to change it.

## Context
- Language and runtime version, if known: @language
- Code to explain: @legacyCode
- What I need to do with it: @goal
- What I already know about it: @knownContext

## Method
1. Describe what the code does at a high level, in plain language, before any detail.
2. Walk through it in execution order. For each section, explain what it does and why it likely exists. Label inferences about intent as "likely".
3. Trace the data: inputs, transformations, outputs, and any global or shared state it reads or writes.
4. Identify risks: side effects, hidden dependencies, implicit ordering, error handling that swallows failures, outdated or deprecated APIs, and anything surprising.
5. Given @goal, point to the safest places to make the change and what to check before and after.

## Output format
1. **Purpose**: two to three sentences.
2. **Walkthrough**: numbered sections with line or function references.
3. **Data flow**: inputs, outputs, and state.
4. **Risks and surprises**: list, ordered by how likely they are to hurt.
5. **Change plan for the goal**: steps, plus tests or checks to run first.
6. **Unknowns**: what you could not determine from this code alone.

## Missing information
- Separate what the code shows from what you infer. Never present a guess about business intent as fact.
- If the code calls something you cannot see, name it, say what you expect it to do, and mark that expectation as unverified.
- If @goal is unclear or the snippet looks truncated, ask a question before proposing changes.
