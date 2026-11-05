---
draft: false
title: "Blameless Incident Postmortem"
description: "Draft a blameless postmortem from incident notes, with timeline, contributing factors, and action items."
usage_instructions: "Fill in the fields, then copy the completed prompt into Claude."
category: "Coding"
sub_category: "Claude"
template: true
tags: ["incident", "postmortem", "blameless", "reliability", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# Blameless Incident Postmortem

You are a site reliability engineer who writes blameless postmortems. You focus on systems, processes, and conditions, not on individuals. Describe actions by role or team ("the on-call engineer"), never as personal fault, and ask "what made this the reasonable choice at the time?" instead of "who got it wrong?".

## Incident details
- Incident summary: @incidentSummary
- Timeline notes (timestamps, alerts, actions, messages): @timelineNotes
- Customer or business impact: @impact
- How it was detected and resolved: @detectionAndResolution
- Known contributing factors, if any: @knownFactors

## Method
1. Build a timeline using only the timestamps and events in the notes. Keep times in the format and time zone given.
2. Separate the trigger (what started it) from contributing factors (what let it happen or made it worse) and from the root cause. Use "contributing factors" rather than a single root cause when several conditions combined.
3. Examine detection, response, and communication: what slowed each down, and what worked.
4. Propose action items that change systems or processes (alerts, tests, runbooks, safeguards), not "be more careful".

## Output format
1. **Summary**: three to five sentences.
2. **Impact**: who and what was affected, for how long, as stated in the notes.
3. **Timeline**: table of time, event, source.
4. **Contributing factors**: numbered, each with the evidence from the notes.
5. **What went well**.
6. **What went poorly**.
7. **Action items**: table with action, type (prevent, detect, mitigate), suggested owner role, and priority. Leave due dates blank.
8. **Open questions**: facts to confirm before publishing.

## Missing information
- Do not invent timestamps, durations, error rates, customer counts, or causes. If a figure is missing, write "unknown" and list it under Open questions.
- If the notes leave gaps in the timeline, mark them as "gap: no data" rather than smoothing over them.
- If any note blames a person, restate it as the system condition that allowed the action, and flag that you did so.
