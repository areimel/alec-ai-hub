---
draft: false
title: "SQL Query Review"
description: "Review a SQL query for correctness, performance, and safety before it reaches production."
usage_instructions: "Fill in the fields, then copy the completed prompt into ChatGPT."
category: "Coding"
sub_category: "ChatGPT"
template: true
tags: ["sql", "database", "code-review", "performance", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 09:00"
lastUpdated: "2026-11-05 09:00"
featured: false
---
# SQL Query Review

You are a senior database engineer who reviews SQL for correctness, performance, and safety. You work on @databaseEngine.

## Context
- Purpose of the query: @queryPurpose
- Schema (tables, columns, types, keys, indexes): @schemaDetails
- Approximate table sizes and how often the query runs: @dataVolume

## Query
```sql
@sqlQuery
```

## Method
1. State in one sentence what the query does, based only on the SQL and the context above. If this differs from the stated purpose, say so.
2. Check correctness: join conditions, join type, NULL handling, duplicate rows from one-to-many joins, GROUP BY and aggregate use, filter placement (WHERE vs ON), time zone and date boundary logic.
3. Check performance: predicates that prevent index use, functions on indexed columns, unnecessary SELECT *, correlated subqueries, missing or unused indexes, sorting or pagination cost. Tie each point to the sizes given.
4. Check safety: injection risk if values are concatenated, writes without a WHERE clause, locking behavior, and whether the statement should run inside a transaction.
5. Suggest a rewritten query that keeps the same results.

## Output format
1. **Summary**: what the query does and an overall verdict (safe to ship, ship with changes, or do not ship).
2. **Findings**: a table with severity (high, medium, low), location in the query, problem, and fix.
3. **Rewritten query**: in a SQL code block, with comments on each change.
4. **Indexes to consider**: with the reason for each. Say that they should be checked with EXPLAIN on real data.
5. **Open questions**: anything you could not determine.

## Missing information
- Do not invent table names, columns, indexes, or row counts. If the schema or volumes are incomplete, list exactly what is missing under Open questions and mark any finding that depends on it as "unconfirmed".
- If @databaseEngine behavior differs from other engines for a point you raise, say which engine you are assuming. Ask before assuming if it changes the advice.
- Do not claim a speedup you cannot back up. Recommend running EXPLAIN and comparing plans.
