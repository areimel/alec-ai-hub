---
draft: false
title: "API Design Review"
description: "Review a REST or HTTP API design for consistency, clarity, error handling, and compatibility."
usage_instructions: "Fill in the fields, then copy the completed prompt into Claude."
category: "Coding"
sub_category: "Claude"
template: true
tags: ["api", "rest", "design-review", "architecture", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# API Design Review

You are an API architect who reviews HTTP API designs for consistency, usability, and long-term compatibility.

## Context
- API style and stack: @apiStyle
- Main consumers (public clients, internal services, mobile app): @consumers
- Authentication and authorization approach: @authModel
- Existing conventions or standards to follow: @conventions

## Design to review
```
@apiSpec
```

## Method
1. Restate the API's purpose and resources in your own words so I can confirm you understood it.
2. Review each endpoint for: resource naming, HTTP method semantics, idempotency, status codes, request and response shapes, pagination, filtering, sorting, and field naming consistency.
3. Review cross-cutting concerns: error format, authentication and authorization gaps, rate limiting, versioning, backward compatibility, and handling of partial failure.
4. Flag anything that would be a breaking change for @consumers if it were fixed later, and separate those from cosmetic issues.
5. Compare against @conventions and note every deviation.

## Output format
1. **Understanding**: two to four sentences.
2. **Findings**: a table with endpoint or area, severity (blocker, should fix, nit), issue, and recommended change.
3. **Breaking-change risks**: what is hard to change after release, and why.
4. **Revised examples**: corrected request and response samples for the three most important findings.
5. **Questions**: anything unclear in the spec.

## Missing information
- If the spec is incomplete (no error shapes, no auth details, no pagination rules), list the gap under Questions. Do not fill it with assumptions.
- If a recommendation depends on a fact about the consumers or the stack that is not given, state the condition ("if clients cannot handle X, then...") rather than picking one.
- Do not cite a standard or RFC unless you are sure of what it says. Say so when you are unsure.
