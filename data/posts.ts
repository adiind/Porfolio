import { BlogPost } from '../types/BlogPost';

// Blog posts data - parsed from writing/posts/*.md
// To add new posts, add entries here with the same structure

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 'analytics-first-principles-part-1',
        title: 'The Origin Story: How Data is Born',
        date: '2026-02-02',
        status: 'Published',
        type: 'Course',
        tags: ['analytics', 'data', 'fundamentals', 'course'],
        excerpt: "Part 1 of 3 — Most people encounter data in its final form. To understand analytics, you must understand the raw source. In this series, we trace the lifecycle of data.",
        imageUrl: '/blog/analytics-first-principles/cover.png',
        content: `Most people encounter data in its final form: a dashboard, a spreadsheet, or a chart.

By then, the important decisions about what to store and what to ignore have already been made. To understand analytics, you must understand the raw source.

**Data is memory. It is the byproduct of software doing its job.**

In this three-part series, we are going to trace the lifecycle of data. In Part 1, we look at the origin: how an action becomes a record.

---

## 1. What Data Actually Is

Data is information that software records so it can function.

At its core, the definition is simple: Something happened, and the system decided to remember it.

That "something" is usually one of three things:

- **A user does something:** Clicks, sign-ups, orders. (Captures intent).
- **A system does something:** Server failures, timestamps, retries. (Captures reality).
- **A business rule is enforced:** Tax calculations, inventory deductions. (Captures constraints).

All of this is written by developers.

**Data is born in code, usually as a "payload" passed between systems.**

---

## 2. From "Payloads" to Tables

Imagine a single user makes a purchase. The software generates a "payload"—a digital receipt of that single event.

It looks like this:

\`\`\`json
{
  "user_id": 1842,
  "order_id": 98371,
  "amount": 420,
  "timestamp": "2026-01-12T10:41:22Z"
}
\`\`\`

Payloads work perfectly for individual events.

They fail when you need to store, search, and retrieve millions of similar events reliably.

**Tables exist to solve this.** They enforce structure so the system can scale. We take the keys (user_id, amount) and turn them into columns. We take the values and turn them into rows.

- **Rows** = Individual occurrences (The events).
- **Columns** = Shared attributes (The details).

---

## 3. The Anchor Story: A Single Order

Let's ground this in a real-world scenario we will follow throughout this series.

**A user places an order.**

- **The Event:** You click "Buy."
- **The Capture:** The system captures the payload.
- **The Storage:** The system writes a row into the orders table.

At this exact moment, the table looks like this:

| order_id | user_id | amount | status |
|----------|---------|--------|--------|
| 98371 | 1842 | 420 | pending |

Nothing analytical is happening here yet. This data exists solely so the warehouse knows what to pack and the app knows what to show you in your "Order History."

---

## 4. The Problem of Fragmentation

Here is where data gets messy.

Just because a record exists in the orders table does not mean the order was successful.

Modern applications are not one big brain; they are many connected systems. When you place an order:

- A **Payments** system charges the card.
- An **Inventory** system checks stock.
- A **Delivery** system assigns tracking.

That single order you placed now exists in pieces across multiple systems.

- The orders table says the order exists.
- The payments table knows if the money actually cleared.
- The inventory table knows if the item actually shipped.

**The "truth" of what happened is now fragmented.**

---

## 5. Why SQL Exists (Reconstructing Reality)

Eventually, you need to answer a simple question: "How much revenue did we actually make?"

- The orders table says $50,000.
- But the payments table shows $5,000 in failed transactions.
- And the inventory table shows $2,000 in out-of-stock refunds.

No single table tells the full story.

**This is why SQL (Structured Query Language) is necessary.** We don't use SQL just to fetch data; we use it to recombine these fragmented records and reconstruct what actually happened.

---

## Summary: The Journey So Far

- **Data starts in code:** It is a memory of an event.
- **Tables are for scale:** They organize millions of events.
- **Reality is fragmented:** A single action is split across many tables.
- **SQL repairs the split:** It recombines the pieces to tell the truth.

---

**Up Next in Part 2:** How do we turn fragmented data into answers? We will move beyond storage and use SQL as a thinking tool to ask and answer real questions.`,
        visibility: 'public',
    },
    {
        id: 'digital-third-places',
        title: 'Digital Third Places',
        date: '2026-01-30',
        status: 'Draft',
        type: 'Note',
        tags: ['portfolio', 'systems', 'play', 'research'],
        excerpt: "I've been thinking a lot about the spaces we inhabit online. Not just the utilities, but the places where we hang out. This note explores that vague feeling of 'presence' we sometimes get in well-designed software.",
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
        content: `I've been thinking a lot about the spaces we inhabit online. Not just the utilities, but the places where we hang out. This note explores that vague feeling of 'presence' we sometimes get in well-designed software.

**Digital third places aren't defined by features, but by the permission to loiter. They are software environments that feel distinct from 'productivity' or 'consumption' loops.**

It's about the difference between a hallway and a room. A hallway is for transit; it optimizes flow. A room is for staying. Most apps today are hallways.

When we look at early MMORPGs or even early forums, the 'stickiness' wasn't gamification. It was the sense of other people being *there*, even if idle. The cursor presence in multiplayer editors evokes a ghost of this.

What if we designed for loitering? Lowering the stakes of interaction. Passive visibility over active signaling.

### Where this might show up later

- Project page
- Interview talking point
- Design exploration
- Class reflection`,
        visibility: 'public',
    },
];
