---
title: "Analytics from First Principles — Part 1"
status: "Published"
type: "Course"
tags: ["analytics", "data", "fundamentals", "course"]
date: "2026-02-02T13:30:00.000Z"
visibility: public
series: "Analytics from First Principles"
part: 1
totalParts: 3
---

# What Data Is, Where It Comes From, and Why Analytics Exists

*Part 1 of 3 — Analytics from First Principles*

---

## Who this part is for

This part is for anyone who has used data but never really questioned it:

- Aspiring analysts
- Product managers
- Designers working with metrics
- Engineers curious about analytics
- Founders trying to make sense of dashboards

No SQL. No tools.
This part builds the mental model everything else depends on.

---

## Module 1: What Is Data (Really)

Most people think data is numbers in tables.
That's already too late in the story.

**Data is recorded behavior.**

Every time:
- a user clicks something
- a system updates state
- a payment succeeds or fails
- a form is submitted
- a job runs in the background

…something happened, and the system chose to remember it.

That memory is data.

![A single user action branches into multiple system actions](/blog/analytics-first-principles/data-flow.png)
*A user clicking "Place Order" triggers API calls, database writes, logs, notifications, and retry queues — not tables yet, just flow.*

### Key idea

Data does not exist because analytics needs it.
Data exists because software needs memory.

Analytics comes later.

---

## Module 2: Where Data Comes From

To understand analytics, you need to understand why data was created in the first place.

### 1. User-generated data

Created when users do something intentionally:
- sign up
- log in
- place an order
- like a post
- cancel a subscription

This data reflects **intent**, but not always truth.

Users misclick. They abandon flows. They retry.

### 2. System-generated data

Created whether users notice it or not:
- logs
- background jobs
- retries
- failures
- timestamps
- state transitions

This data reflects **reality**, but not always meaning.

### 3. Business-generated data

Created for operations:
- payments
- invoices
- refunds
- inventory
- compliance records

This data reflects **rules and constraints**, not experience.

![Three data sources converging into a unified data layer](/blog/analytics-first-principles/data-sources.png)
*User actions, system actions, and business actions all feed into a shared data layer.*

### Important implication

No single dataset tells the whole story.

Analytics exists because reality is fragmented across sources.

---

## Module 3: How Developers Think About Data

This is where most analytics confusion begins.

Developers don't design tables to answer questions.
They design tables to make software work.

### What developers optimize for

- Correctness
- Performance
- Reliability
- Simplicity of state
- Safety during failures

### What developers do NOT optimize for

- Analysis
- Metrics
- Long-term trend questions
- Ambiguity resolution

This creates tension — and that tension is normal.

![Developer vs Analyst mental models with shared data in the middle](/blog/analytics-first-principles/mental-models.png)
*Developers think about state, correctness, and performance. Analysts think about questions, patterns, and trends. They meet at shared data.*

### Key examples of the tension

- A status column that keeps getting overwritten
- Rows deleted instead of archived
- Data normalized across many tables
- No record of "why" something changed

Nothing here is "wrong."
It just wasn't built for you.

**Analytics begins when you accept this.**

---

## Module 4: How Data Becomes Tables

Now we finally talk about tables — but properly.

### Rows are not "entries"

A row is a record of something the system chose to remember.

It might represent:
- **An event** (something happened)
- **A state** (this is true now)
- **A snapshot** (this was true then)

![Three table types: event log, state table, and daily snapshot](/blog/analytics-first-principles/table-types.png)
*Event logs append-only, state tables get overwritten, snapshot tables preserve history.*

### Columns are not metrics

Columns are attributes, not insights.

Metrics are **derived**.
They don't exist in raw data.

### Grain (the most important concept)

Grain answers one question:

**What does one row represent?**

- One user?
- One order?
- One item within an order?
- One event at a moment in time?

If you don't know the grain, you cannot:
- join tables safely
- count anything correctly
- trust any metric

![Understanding the grain: what does one row represent?](/blog/analytics-first-principles/grain-concept.png)
*THIS is the grain — understanding exactly what each row represents.*

This single idea will save you months of confusion later.

---

## Module 5: Why Raw Data Is Not Enough

At this point, you might ask:

> "If data exists, why do we need analytics?"

Because raw data is:
- Optimized for machines, not humans
- Full of edge cases
- Contradictory across sources
- Silent about meaning

**Two tables can both be "correct" and still disagree.**

### Analytics exists to:

- Reconcile inconsistencies
- Make assumptions explicit
- Choose interpretations consciously
- Align teams on what is believed to be happening

![Raw data tables converging into interpreted reality](/blog/analytics-first-principles/interpreted-reality.png)
*Multiple raw tables — orders, logs, users, payments — converge into a single interpreted reality: shared understanding.*

### The key insight

Analytics is not about truth.
It's about **shared understanding**.

---

## Module 6: What Analytics Actually Is

Analytics is the practice of:

- Asking structured questions
- Using imperfect evidence
- To support decisions under uncertainty

It sits between:
- Raw system data
- And human judgment

### It is NOT:

- Dashboards
- SQL tricks
- Charts
- Data science

Those are tools.

**Analytics is thinking with constraints.**

---

## What's Next

In **Part 2**, we'll explore how to ask the right questions — the frameworks that separate good analysis from noise.

In **Part 3**, we'll cover building sustainable analytics practices — from ad-hoc queries to reproducible insights.

---

*This is Part 1 of a 3-part series on Analytics from First Principles.*
