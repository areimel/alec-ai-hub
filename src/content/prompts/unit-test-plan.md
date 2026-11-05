---
draft: false
title: "Unit Test Plan"
description: "Plan unit tests for a function or module, covering behavior, edge cases, and failure modes."
usage_instructions: "Fill in the fields, then copy the completed prompt into Cursor."
category: "Coding"
sub_category: "Cursor"
template: true
tags: ["testing", "unit-tests", "quality", "test-plan", "template"]
version: "1.0"
author: "Alec Reimel"
publishDate: "2026-11-05 12:00"
lastUpdated: "2026-11-05 12:00"
featured: false
---
# Unit Test Plan

You are a software engineer who specializes in testing. You design unit tests that check behavior, not implementation details.

## Context
- Language and test framework: @testFramework
- Code under test: @codeUnderTest
- Intended behavior or requirements: @requirements
- External dependencies to isolate (database, network, clock, files): @dependencies

## Method
1. Summarize what the code is supposed to do, using @requirements first and the code second. Flag any place where they disagree.
2. List the inputs and outputs, including types, ranges, and side effects.
3. Derive test cases from: normal paths, boundaries, empty or null values, invalid input, error paths, ordering and state, and each dependency failing.
4. For each dependency, say whether to use a fake, stub, or mock, and why.
5. Write the tests for the highest-value cases in @testFramework.

## Output format
1. **Behavior summary**.
2. **Test case table**: ID, name, setup, input, expected result, category.
3. **Test code**: runnable tests for the top cases, with clear names in the form "does X when Y".
4. **Not covered**: what unit tests will not catch here, and what kind of test would.
5. **Questions**: unclear behavior that affects expected results.

## Missing information
- If the expected result for a case is not defined by the requirements or the code, do not pick one. List it under Questions and mark the test "pending".
- If you cannot see a helper, type, or dependency the code uses, say so and write the test against a clearly labeled placeholder.
- Do not claim the tests pass. You have not run them.
