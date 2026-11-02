# AI Prompt Strategy — BookLeaf Royalty Summary

> Design rationale, prompt structure, edge case handling, and sample output analysis.

---

## 🎯 Objective

Generate a **personalised, professional royalty summary email** that a BookLeaf author would genuinely find useful — not a generic template, but a communication that reflects their specific sales performance, royalty situation, and book production status, written in BookLeaf's warm editorial voice.

---

## 🧠 Model Choice: GPT-4o-mini

| Factor | Decision |
|--------|----------|
| **Model** | `gpt-4o-mini` |
| **Cost** | ~$0.15/1M input tokens — affordable for operational use |
| **Speed** | ~1-3 seconds response — acceptable for admin-triggered action |
| **Quality** | Excellent instruction following and structured output |
| **Max tokens** | 1000 output tokens — sufficient for 250-400 word email |
| **Temperature** | 0.7 — warm and natural, not robotic (0.0) or uncontrolled (1.0) |

**Why not GPT-4o or Claude Opus?**
These are 10-20× more expensive with marginal quality gains for a structured email generation task. The assignment permits budget-friendly models explicitly.

**Why not Claude Haiku?**
Both are acceptable. GPT-4o-mini was chosen for its predictable JSON-following behavior and OpenAI's wider n8n integration support.

---

## 🏗️ Two-Prompt Architecture

The workflow uses a **split system/user prompt** pattern:

### System Prompt — Persona & Policy

The system prompt defines WHO the AI is and WHAT it knows. It is reused across all author calls (same BookLeaf persona + payout policy for every author).

**What it contains:**
1. **Persona definition:** "You are a warm, professional communication specialist for BookLeaf Publishing"
2. **Tone guidelines:** warm but professional, use "we/our team", celebrate milestones, avoid jargon, no corporate coldness
3. **Payout policy knowledge base:** quarterly cycle (Q1-Q4), 45-day processing window, ₹500 minimum threshold
4. **Output format rules:** Start with "Subject:" on line 1, 250-400 words, no HTML tags, no placeholder text

**Why a system prompt for this?**
- Cost-efficient: these ~300 tokens of context are the same for every call. If we were using a stateful conversation API, this would be cached. Even without caching, it precisely controls tone across all 10 authors.
- Separation of concerns: the system prompt carries "what BookLeaf sounds like" while the user prompt carries "this specific author's data."

---

### User Prompt — Author-Specific Data

The user prompt injects the complete, formatted data payload for the specific author.

**Structure:**
```
AUTHOR DETAILS: name, city

CONSOLIDATED ROYALTY SUMMARY:
- Total earned, paid, pending
- Overall status (Fully Paid / Pending / Overdue)
- Next expected payout quarter

PUBLISHED BOOKS (for each):
- Title, genre, ISBN
- Publication date, MRP, royalty per copy
- Copies sold, total earned, paid, pending
- Last payout date
- Status badge (✅ / 🟡 / 🔴)
- Available on platforms

BOOKS IN PRODUCTION (if any):
- Title, current production stage

INSTRUCTIONS (conditional):
- If pending = 0: celebrate
- If pending > 0 and within cycle: explain quarterly timeline
- If pending > 0 and overdue: acknowledge delay + next steps
- If books in production: brief status update
```

**Why explicit instructions in the user prompt?**
Without explicit instruction, GPT will sometimes default to a generic template. The conditional instructions force it to choose the right tone and content for this author's specific situation.

---

## 🔀 Edge Case Handling

The n8n Code node (`Build AI Prompt`) pre-processes the data and determines the right instruction branch before calling the AI. This prevents the AI from having to make logic decisions — it just writes the email.

| Edge Case | Data Signal | Prompt Instruction |
|-----------|------------|-------------------|
| **All royalties paid** | `royalty_pending = 0` (all books) | "Celebrate that all royalties are fully paid up. Acknowledge their sales performance." |
| **Pending within cycle** | `royalty_pending > 0` AND last payout < 90 days | "Explain pending amount is within normal quarterly cycle. Give next payout window." |
| **Overdue — Last payout old** | `royalty_pending > 0` AND last payout > 90 days | "Apologise for delay, assure processing, provide next steps." |
| **Overdue — Never paid** | `royalty_pending > 0` AND `last_payout_date = null` | Treated as overdue. Same apologetic tone. |
| **Books in production** | `status` does NOT contain "Published" | "Give brief, encouraging production status update for each in-production book." |
| **Mixed: paid + pending + production** | Combination of above | All clauses fire — AI handles all three sections in one email |

---

## 📝 Sample Generated Email

*Based on author: Ananya Reddy (Between Two Temples — published July 2024, ₹2,546 pending, never paid)*

---

**Subject:** Your Royalty Update — Between Two Temples

Dear Ananya,

We wanted to reach out with a personal update on your royalties — and first, a heartfelt congratulations on the journey so far with *Between Two Temples*. Since its launch in July 2024, your book has found 67 readers who've chosen to bring a piece of your story home, and that's something to be genuinely proud of.

Here's a summary of where your royalties stand:

**Between Two Temples** (Historical Fiction)
- Total copies sold: 67
- Total royalty earned: ₹2,546
- Royalty paid to date: ₹0
- Royalty pending: ₹2,546
- Last payout: No payout yet

**Consolidated across all your books:**
- Total earned: ₹2,546
- Total paid: ₹0
- Total pending: ₹2,546

We want to be transparent with you — your book has been live for over 90 days, and you haven't yet received your first royalty disbursement. This is something our team is actively working to resolve. Royalty payouts are processed quarterly (our Q1 cycle runs January through March, with disbursements by mid-May), and your ₹2,546 will be processed in the upcoming cycle.

If you have any questions in the meantime, please don't hesitate to get in touch directly with our royalties team. You deserve clear, timely communication, and we're committed to making that happen.

Thank you for being part of the BookLeaf family. We're genuinely glad *Between Two Temples* is in the world.

Warm regards,
The BookLeaf Team

---

## ✅ Quality Criteria Met

| Criterion | How Met |
|-----------|---------|
| Personalised greeting | Author's first name used; "In July 2024" — actual date injected |
| Per-book breakdown | All figures injected; formatted in ₹ INR |
| Total earned/paid/pending | Clear consolidated summary section |
| Payout timing explanation | Quarterly cycle + 45-day window explained contextually |
| Overdue acknowledgment | Transparent apology; avoids hedging |
| Warm, professional closing | BookLeaf editorial tone preserved |
| No placeholders | All `[Author Name]` etc. are resolved in the prompt before AI sees them |
| No filler phrases | System prompt explicitly bans "I hope this email finds you well" style openers |

---

## 💰 Cost Estimation

For the 10 authors in the sample dataset:

| Component | Estimate |
|-----------|---------|
| System prompt (all calls) | ~300 tokens × 10 = 3,000 tokens |
| User prompt per author (avg) | ~600 tokens × 10 = 6,000 tokens |
| AI output per author (avg) | ~400 tokens × 10 = 4,000 tokens |
| **Total tokens** | ~13,000 tokens |
| **Cost at GPT-4o-mini rates** | ~$0.002 (< ½ cent) |

Running the full bulk trigger for all 10 authors costs approximately **$0.002** — negligible.

---

## 🔄 Prompt Iteration History

**v1 (initial):** Simple one-shot prompt with all data. Problem: AI sometimes ignored pending amounts and wrote a generic congratulations email.

**v2:** Added explicit conditional instructions (`if pending = 0 then... else if pending > 0 then...`). Better, but tone was occasionally corporate.

**v3 (current):** Separated system/user prompts. System prompt defines BookLeaf persona and bans filler phrases explicitly. User prompt carries data + conditional instructions. Result: consistently warm, accurate, and personalised output.

---

*This document accompanies the n8n workflow export and README as part of the BookLeaf Assignment 2 deliverables.*
