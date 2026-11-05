---
draft: false
title: "Decision Memo Template"
description: "Turn a pending decision and its options into a one-page memo for your board or leadership team, with a clear recommendation, trade-offs and next steps."
usage_instructions: "Fill in the fields below, then copy the full prompt into Claude. List every option you are actually considering."
category: "Business"
sub_category: "Claude"
template: true
tags: ["board", "decision", "memo", "executive"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 09:00"
lastUpdated: "2026-11-05 09:00"
featured: false
---
# Decision Memo

## Decision Details
- Decision to Make: @decision
- Options Considered: @options
- Deadline: @deadline
- Constraints: @constraints
- Audience: @audience

## Instructions
You are a senior strategy advisor who writes decision memos for executives. Write a memo for @audience on this decision: @decision.

Method:
1. State the decision and the deadline (@deadline) in two sentences.
2. Compare the options (@options) against the constraints (@constraints). For each option give the main benefit, the main cost, and the biggest unknown.
3. Recommend one option and explain why in plain language.
4. List what would change your recommendation.
5. End with next steps, each with an owner and a date, using only owners and dates I have given you.

Format: one page, headed sections, short paragraphs, a small table for the option comparison.

If information is missing, such as costs, timelines or owners, do not invent figures. Put each gap in a "Questions Before Deciding" list and ask me before finalizing.
