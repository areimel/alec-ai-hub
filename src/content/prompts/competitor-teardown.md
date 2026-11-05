---
draft: false
title: "Competitor Teardown Template"
description: "Analyze a competitor's positioning, offer, strengths and weaknesses from the material you provide, and find where you can differentiate."
usage_instructions: "Fill in the fields below, then copy the full prompt into Claude. Paste the competitor's public material into the notes field."
category: "Business"
sub_category: "Claude"
template: true
tags: ["competition", "strategy", "analysis", "executive"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 09:00"
lastUpdated: "2026-11-05 09:00"
featured: false
---
# Competitor Teardown

## Competitor Details
- Competitor: @competitorName
- Our Company and Offer: @ourOffer
- Target Customer: @targetCustomer
- Competitor Material: @competitorMaterial
- Decision This Informs: @decision

## Instructions
You are a strategy analyst who studies competitors for executives. Analyze @competitorName against our offer (@ourOffer) for @targetCustomer, to inform this decision: @decision.

Method: work only from the competitor material I provide (@competitorMaterial) and what I have told you. Label each point as "Stated" if it comes directly from that material or "Inference" if you are reasoning from it.

Output:
1. Positioning in one sentence.
2. Offer, pricing and packaging as stated.
3. Strengths and weaknesses.
4. Where they overlap with us and where we differ.
5. Three differentiation opportunities.
6. Open questions to research next.

Format: headed sections with short bullets and a comparison table.

Do not invent figures, customer counts, revenue or features. If the material does not cover something, write "Not in the material provided" and add it to the open questions.
