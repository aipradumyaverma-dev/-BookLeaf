# 📚 BookLeaf – Author Royalty Dashboard & Automated Notification System

> **Assignment 2 | BookLeaf Publishing**
> Platform: Bubble.io + n8n + OpenAI
> Built by: Pradumya Verma

---

## 🔗 Live Application

| Resource | Link |
|----------|------|
| **Bubble App (Live URL)** | `https://YOUR-APP.bubbleapps.io` |
| **Author Test Account** | `priya.sharma@email.com` / `password123` |
| **Second Author** | `rohit.kapoor@email.com` / `password123` |
| **Admin Account** | `admin@bookleafpub.com` / `admin123` |
| **n8n Workflow** | See `n8n_workflow_export.json` in this folder |

> ⚠️ **Note:** Replace the Bubble URL above with your actual deployed app URL once set up.

---

## 📁 Deliverables in This Folder

```
BookLeafpub-2/
├── bookleaf_sample_data.json      ← Source of truth dataset (10 authors, 18 books)
├── n8n_workflow_export.json       ← Complete n8n workflow (import-ready JSON)
├── README.md                      ← This documentation
├── bubble_setup_guide.md          ← Step-by-step Bubble database & UI setup
└── prompt_strategy.md             ← AI prompt design & strategy documentation
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  BUBBLE.IO APP                       │
│                                                      │
│  ┌──────────────┐      ┌───────────────────────┐    │
│  │ Author Portal │      │    Admin Portal        │    │
│  │              │      │                        │    │
│  │ • Login      │      │ • All Authors List     │    │
│  │ • My Books   │      │ • Author Detail View   │    │
│  │ • Royalties  │      │ • Trigger Summary Btn  │    │
│  │ • Status     │      │ • Bulk Trigger         │    │
│  │   Badges     │      │ • Notification Log     │    │
│  └──────────────┘      └──────────┬────────────┘    │
│                                   │                  │
│         Bubble Data API ◄─────────┘                  │
└───────────────────────┬─────────────────────────────┘
                        │ POST webhook (+ x-api-key)
                        ▼
┌─────────────────────────────────────────────────────┐
│                    n8n WORKFLOW                      │
│                                                      │
│  Webhook Trigger → Validate Input                    │
│       ↓                                              │
│  Fetch Author + Books (Bubble Data API)              │
│       ↓                                              │
│  Aggregate Data + Compute Totals                     │
│       ↓                                              │
│  Build AI Prompt (system + user)                     │
│       ↓                                              │
│  Call OpenAI gpt-4o-mini                             │
│       ↓                                              │
│  Extract Email Content (Subject + Body)              │
│       ↓                                              │
│  PATCH NotificationLog → Bubble (Success/Failed)     │
│       ↓                                              │
│  Respond 200/500 to Bubble Workflow                  │
└─────────────────────────────────────────────────────┘
```

---

## 🗃️ Bubble Database Schema

### Why this structure?

The assignment mirrors a relational data model inside Bubble's NoSQL-style database. I created three separate Data Types — **Author**, **Book**, and **NotificationLog** — with explicit relationships between them. This keeps data normalised, avoids duplication, enables filtered queries, and supports Bubble's privacy rules (which operate at the Data Type level).

---

### Data Type: `Author`

| Field Name | Type | Notes |
|------------|------|-------|
| `author_id` | Text | e.g. AUTH001 — used as external identifier |
| `name` | Text | Full display name |
| `email` | Text | Unique. Also the User's login email in Bubble |
| `phone` | Text | e.g. +91-98765-43210 |
| `city` | Text | Used for admin filtering |
| `joined_date` | Date | Author onboarding date |
| `User` | User (Bubble built-in) | 1:1 link to Bubble's auth user |

> **Why link to Bubble's User?** Bubble's authentication and privacy rules operate on the built-in `User` type. The `Author` type holds domain-specific fields; `User` handles credentials. They're linked via the `User` field.

---

### Data Type: `Book`

| Field Name | Type | Notes |
|------------|------|-------|
| `book_id` | Text | e.g. BK001 |
| `author` | Author | Relationship to Author data type |
| `title` | Text | Book title |
| `isbn` | Text | ISBN string |
| `genre` | Text | Literary Fiction, Self-Help, etc. |
| `publication_date` | Date | Null if not yet published |
| `status` | Text | "Published & Live" / "In Production - ..." |
| `mrp` | Number | MRP in INR. Null if in production |
| `author_royalty_per_copy` | Number | Per-copy royalty amount |
| `total_copies_sold` | Number | Running total |
| `total_royalty_earned` | Number | Computed: copies × royalty per copy |
| `royalty_paid` | Number | Amount already disbursed |
| `royalty_pending` | Number | Earned minus paid |
| `last_royalty_payout_date` | Date | Null if never paid |
| `print_partner` | Text | In-House / Repro India / Epitome Books |
| `available_on` | List of Text | Amazon India, Flipkart, etc. |

> **Why not embed books inside Author?** Bubble's privacy rules, search, and filtering work much better on top-level Data Types. Embedding would prevent per-book queries and break the admin's ability to filter/search books independently.

---

### Data Type: `NotificationLog`

| Field Name | Type | Notes |
|------------|------|-------|
| `author` | Author | Which author this log entry is for |
| `triggered_by` | User | Admin who clicked the button |
| `triggered_at` | Date | Timestamp of trigger |
| `status` | Text | "Pending" → "Success" or "Failed" |
| `email_subject` | Text | Subject line from AI output |
| `email_body` | Text (long) | Full email body from AI |
| `error_message` | Text | Populated only on failure |
| `error_stage` | Text | Which n8n node failed |
| `completed_at` | Date | When n8n finished processing |
| `tokens_used` | Number | OpenAI token count (for cost tracking) |

> **Design rationale:** The log is created in Bubble *before* the webhook fires (status = "Pending"). n8n then PATCHes it to "Success" or "Failed". This ensures the log always exists regardless of n8n outcome, and it enables idempotency checks.

---

## 🔐 Bubble Privacy Rules

### User Type Rules

| User Type | Rule |
|-----------|------|
| **Author** | `This User = Current User` — authors can only see their own User record |
| **Admin** | No additional constraint — admins see all User records |

### Author Data Type Rules

| Condition | Allowed Fields |
|-----------|---------------|
| `This Author's User = Current User` | All fields (own data) |
| `Current User's role = admin` | All fields |
| Default | No access |

### Book Data Type Rules

| Condition | Allowed Fields |
|-----------|---------------|
| `This Book's Author's User = Current User` | All fields (own books) |
| `Current User's role = admin` | All fields |
| Default | No access |

### NotificationLog Data Type Rules

| Condition | Allowed Fields |
|-----------|---------------|
| `Current User's role = admin` | All fields |
| Default | No access (authors don't see the log) |

---

## 🤖 n8n Workflow — Detailed Breakdown

### Node-by-Node Walk-through

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | **Webhook Trigger** | Webhook | Receives POST from Bubble. Protected by `x-api-key` header. |
| 2 | **Validate & Extract Input** | Code | Validates `author_id` exists. Builds dedup key (`author_id::YYYY-MM-DD`). Throws if missing. |
| 3 | **Fetch Author Data** | HTTP Request | GETs author record from Bubble Data API. Error output → Error Handler. |
| 4 | **Fetch Author's Books** | HTTP Request | GETs all books filtered by `author_id`. Runs in parallel with node 3. |
| 5 | **Check Fetch Success** | IF Node | Validates API returned HTTP 200. Branches to Error Handler on failure. |
| 6 | **Aggregate Data** | Code | Computes consolidated totals, classifies books (published vs in-production), determines payout status and next quarter. |
| 7 | **Build AI Prompt** | Code | Constructs system prompt (tone + policy) and user prompt (author-specific data). Handles all edge cases. |
| 8 | **Call OpenAI API** | HTTP Request | Calls `gpt-4o-mini` with both prompts. 30s timeout. Error output → Error Handler. |
| 9 | **Check AI Response** | IF Node | Validates `choices[0]` exists. Branches to Error Handler if AI failed. |
| 10 | **Extract AI Email Content** | Code | Parses Subject and Body from raw AI output. |
| 11 | **Update Log (Success)** | HTTP Request | PATCHes Bubble NotificationLog with Success + email content + timestamp. |
| 12 | **Respond 200 OK** | Respond to Webhook | Returns success JSON to Bubble. |
| 13 | **Error Handler** | Code | Catches errors from any node. Builds structured error payload. |
| 14 | **Update Log (Failed)** | HTTP Request | PATCHes Bubble NotificationLog with Failed + error details. |
| 15 | **Respond 500 Error** | Respond to Webhook | Returns 500 JSON to Bubble — prevents infinite spinner. |

---

## 🔒 Webhook Security

The n8n webhook is protected using **HTTP Header Authentication** (`x-api-key`).

**How it works:**
1. In Bubble's API Connector, the `Generate & Send` button's backend workflow calls the n8n webhook with a custom header: `x-api-key: YOUR_SHARED_SECRET`
2. In n8n, the Webhook node is configured with `Header Authentication`, verifying this key before processing
3. Any request without the correct key returns 401 immediately

**Why this approach over others:**
- Simpler to configure in Bubble's API Connector than OAuth
- No expiry management needed (unlike tokens)
- Secret is stored in Bubble's private key store (not exposed in frontend)
- Sufficient for internal tooling where the caller (Bubble) is trusted

---

## 🔄 Idempotency Strategy

**Problem:** Admin clicks "Generate & Send" twice quickly for the same author.

**Solution (layered):**
1. **Bubble-side:** The button is disabled immediately on click (via Bubble's "disable button while workflow is running" condition). The button only re-enables when the n8n callback updates the log.
2. **n8n-side:** The Code node builds a `dedup_key = author_id::YYYY-MM-DD`. If Bubble has already created a "Success" log for today, the Bubble workflow checks this before calling the webhook (query NotificationLog where author = X and status = Success and triggered_at ≥ today → if count > 0, skip).
3. **Combination:** Even if both fire simultaneously, the last one to reach Bubble's PATCH endpoint wins but the result is the same — one Success log entry.

---

## ⚠️ Error Handling — Both Systems

### In n8n
- **Every HTTP Request node** has its error output connected to the `Error Handler` code node
- **Every IF node** routes its "false" branch to the `Error Handler`
- The `Error Handler` always PATCHes the Bubble notification log with "Failed" status
- n8n always sends a response (200 or 500) — never leaves Bubble hanging

### In Bubble
- The API Connector workflow has a timeout (set via the connector options)
- After triggering the webhook, a "loading" state is shown to the admin
- If n8n returns 500 or times out: the log entry is marked Failed (by n8n) or Bubble's error branch updates it to Failed
- Admin sees the error message in the Notification Log table — no silent failures

---

## 📊 Data Approach: Webhook Payload vs Bubble Data API

The n8n workflow uses a **hybrid approach**:

- **Webhook carries:** `author_id`, `log_id`, `bubble_base_url`, `bubble_api_key` (minimal payload, fast)
- **n8n fetches:** Full author record + all books from Bubble Data API

**Why not send everything in the webhook?**
- Bubble's "Send Data to External API" action has payload size limits
- Data fetched from the API is always the latest (no stale data issues)
- Cleaner separation of concerns — Bubble manages data, n8n fetches what it needs

**Why not fetch-only (no payload)?**
- The `log_id` must come from Bubble (created before the webhook fires) so n8n can update the correct log entry
- `bubble_api_key` is passed securely as a runtime value, not hardcoded in n8n

---

## 🧠 AI Prompt Strategy

See [`prompt_strategy.md`](./prompt_strategy.md) for the full breakdown. In summary:

- **Model:** `gpt-4o-mini` — cost-effective (~$0.15/1M tokens), fast, excellent instruction following
- **Temperature:** 0.7 — warm and natural tone, not robotic
- **System prompt:** Defines BookLeaf's communication persona, tone guidelines, and quarterly payout policy
- **User prompt:** Injects all author-specific data and handles 4 edge cases (fully paid / pending-normal / pending-overdue / in-production books)
- **Output format:** Subject line + email body, clearly separated, no HTML tags
- **Max tokens:** 1000 — sufficient for 250-400 word email without waste

---

## 🧪 Test Scenarios

| Scenario | Author | Expected Behaviour |
|----------|--------|-------------------|
| All royalties paid | Meera Nair (BK008) | AI celebrates, no pending mention |
| Pending (within cycle) | Priya Sharma (BK001) | AI explains quarterly cycle, gives next payout estimate |
| Overdue (no payout ever) | Ananya Reddy (BK005) | AI acknowledges delay, explains processing |
| Book in production | Sneha Kulkarni (BK013) | AI gives production status update |
| Mixed: paid + pending + production | Kavita Deshmukh | AI handles all three in one email |
| Admin bulk trigger | All authors with pending > 0 | Each author's log entry created; n8n called once per author |

---

## 📋 All Test Accounts

### Admin Accounts
| Email | Password |
|-------|----------|
| admin@bookleafpub.com | admin123 |
| support@bookleafpub.com | support123 |

### Author Accounts (All use `password123`)
| Author | Email | City | Books |
|--------|-------|------|-------|
| Priya Sharma | priya.sharma@email.com | Mumbai | 2 (both published) |
| Rohit Kapoor | rohit.kapoor@email.com | Delhi | 2 (both published, high sales) |
| Ananya Reddy | ananya.reddy@email.com | Hyderabad | 1 (published, never paid) |
| Vikram Joshi | vikram.joshi@email.com | Pune | 2 (both published) |
| Meera Nair | meera.nair@email.com | Kochi | 2 (both published, one fully paid) |
| Arjun Malhotra | arjun.malhotra@email.com | Chandigarh | 1 (published, never paid) |
| Sneha Kulkarni | sneha.kulkarni@email.com | Bangalore | 3 (2 published + 1 in production) |
| Farhan Sheikh | farhan.sheikh@email.com | Lucknow | 1 (fully paid) |
| Kavita Deshmukh | kavita.deshmukh@email.com | Nagpur | 2 (1 in production + 1 published, never paid) |
| Diya Chatterjee | diya.chatterjee@email.com | Kolkata | 2 (both published, mixed status) |

---

## 🛠️ Setup Instructions (n8n)

### 1. Import the Workflow
1. Open your n8n instance (Cloud or self-hosted)
2. Go to **Workflows → Import from file**
3. Select `n8n_workflow_export.json`
4. Click **Import**

### 2. Configure Credentials
Create the following credentials in n8n:

**Webhook Header Auth:**
- Name: `BookLeaf Webhook API Key`
- Header Name: `x-api-key`
- Header Value: `your_chosen_secret_key`

**Bubble API:**
- No separate credential needed — Bubble API key is passed at runtime in the webhook payload for security

**OpenAI:**
- Replace `YOUR_OPENAI_API_KEY` in the "Call OpenAI API" node with your actual key, or configure an n8n OpenAI credential

### 3. Make Webhook Public (if self-hosted)
If running n8n locally, use **ngrok** to expose your webhook:
```bash
ngrok http 5678
# Copy the https://xxxxx.ngrok.io URL
# Your webhook will be: https://xxxxx.ngrok.io/webhook/bookleaf-royalty-summary
```

### 4. Connect Bubble
In Bubble's API Connector:
1. Add a new API called "n8n BookLeaf"
2. Base URL: your n8n webhook URL
3. Authentication: Add shared header `x-api-key: your_chosen_secret_key`
4. Create an action call for the POST endpoint

---

## 🐛 Known Limitations & What I'd Improve

1. **Actual email sending:** The current workflow logs the email to Bubble but doesn't send it via SMTP. Would wire up n8n's Email node (or SendGrid) as an additional step after the OpenAI call.

2. **Bubble Data API limitations:** Bubble's free plan has rate limits on API calls. For the bulk trigger (10 authors), requests are sequential. A paid n8n instance with retry logic would handle this more robustly.

3. **Real-time updates:** Currently the admin must refresh the Notification Log to see the updated status. Would use Bubble's real-time database trigger to auto-refresh the repeating group.

4. **n8n self-hosting:** For production, would host n8n on Railway or DigitalOcean with a persistent database (PostgreSQL) instead of ngrok tunnelling.

5. **OpenAI API key rotation:** Currently hardcoded in the HTTP Request node. Would move to n8n's built-in OpenAI credential type for easier key rotation.

---

## 📖 Learning Process (Bubble)

This was my first time building a production-grade application in Bubble. Here's how I approached the learning curve:

**Week 1**
- Read through Bubble's official manual (manual.bubble.io) — specifically the Data, Privacy Rules, and Workflows sections
- Watched the official Bubble YouTube tutorials on Data Types and Repeating Groups
- Built a throwaway test app to understand how Bubble's database relationships work vs SQL joins

**Key "aha" moments:**
- Privacy rules in Bubble are evaluated at query time, not just display time — this is why properly structured Data Types matter
- Bubble's "When Page Loads" workflow is the equivalent of `useEffect(() => {}, [])` in React — essential for populating dynamic data
- The API Connector plugin is how Bubble calls external APIs — it works as both a data source and workflow action

**What was hardest:**
- Understanding that Bubble's "current cell's" context in Repeating Groups is only available inside that group
- Configuring the `PATCH` API call back from n8n required careful matching of Bubble's Data API URL format

**What would I do differently:**
- Plan the Privacy Rules before building any pages — changing them later broke several Repeating Group queries
- Keep page workflows small and use reusable elements + custom states to manage loading/error states

---

*Submitted as part of BookLeaf Publishing's technical assessment — Assignment 2.*
*Contact: pradumyaverma@email.com*
