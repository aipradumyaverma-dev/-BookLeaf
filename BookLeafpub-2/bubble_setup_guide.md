# Bubble.io Complete Setup Guide

> Step-by-step instructions for building the BookLeaf Author Royalty Dashboard in Bubble.io

---

## 📋 Prerequisites

1. Create a free account at [bubble.io](https://bubble.io)
2. Create a new app — choose a name like `bookleaf-royalty`
3. Choose the blank template (not a pre-built one)

---

## Part 1: Database Setup

### Step 1 — Create the `Author` Data Type

Go to **Data → Data Types → New Type → "Author"**

Add these fields (click "Add a new field" for each):

| Field Name | Field Type | Options |
|------------|-----------|---------|
| `author_id` | Text | — |
| `name` | Text | — |
| `phone` | Text | — |
| `city` | Text | — |
| `joined_date` | Date | — |
| `User` | User | — |

> **Note:** The `email` field is on Bubble's built-in `User` type — access it via `Author's User's email`.

---

### Step 2 — Create the `Book` Data Type

Go to **Data → Data Types → New Type → "Book"**

| Field Name | Field Type | Options |
|------------|-----------|---------|
| `book_id` | Text | — |
| `author` | Author | — |
| `title` | Text | — |
| `isbn` | Text | — |
| `genre` | Text | — |
| `publication_date` | Date | — |
| `status` | Text | — |
| `mrp` | Number | — |
| `author_royalty_per_copy` | Number | — |
| `total_copies_sold` | Number | — |
| `total_royalty_earned` | Number | — |
| `royalty_paid` | Number | — |
| `royalty_pending` | Number | — |
| `last_royalty_payout_date` | Date | — |
| `print_partner` | Text | — |
| `available_on` | List of Text | Check: "This field is a list" |

---

### Step 3 — Create the `NotificationLog` Data Type

Go to **Data → Data Types → New Type → "NotificationLog"**

| Field Name | Field Type | Options |
|------------|-----------|---------|
| `author` | Author | — |
| `triggered_by` | User | — |
| `triggered_at` | Date | — |
| `status` | Text | Default: "Pending" |
| `email_subject` | Text | — |
| `email_body` | Text | Check: "Allow long text" |
| `error_message` | Text | — |
| `error_stage` | Text | — |
| `completed_at` | Date | — |
| `tokens_used` | Number | — |

---

### Step 4 — Manually Enter Data

Go to **Data → App Data → Author** and click "New entry" for each author.

Enter all 10 authors from `bookleaf_sample_data.json`. For each author:
1. Fill in `author_id`, `name`, `phone`, `city`, `joined_date`
2. Note the Bubble-generated `_id` (you'll need it for books)

Go to **Data → App Data → Book** and enter all 18 books.
- For the `author` field, search and select the corresponding Author record

> **Tip:** Use Bubble's CSV import. Format the data as CSV with column headers matching field names. Go to Data → Upload Data.

---

### Step 5 — Create User Accounts

Go to **Data → App Data → User** → New Entry for each author + admin:

For each author user:
- `email`: e.g. `priya.sharma@email.com`
- `password`: `password123` (Bubble hashes this automatically)
- After creating, link the Author record: find the Author entry → set its `User` field

For admin users:
- Create two Users with `admin@bookleafpub.com` and `support@bookleafpub.com`
- Add a custom field on User called `role` (Text) — set to "admin" for admins, "author" for authors

---

## Part 2: Privacy Rules

Go to **Data → Privacy** for each Data Type.

### User Rules

Click on **User** → Add Rule:
- **Rule name:** Author Self
- **When:** `Current User is logged in` AND `This User = Current User`
- **Fields:** Allow all fields

- **Rule name:** Admin All
- **When:** `Current User is logged in` AND `Current User's role = "admin"`
- **Fields:** Allow all fields

### Author Rules

Click on **Author** → Add Rule:
- **Rule name:** Own Author Record
- **When:** `This Author's User = Current User`
- **Fields:** Allow all fields

- **Rule name:** Admin Full Access
- **When:** `Current User's role = "admin"`
- **Fields:** Allow all fields

- **Default:** No access (leave unchecked)

### Book Rules

- **Rule name:** Own Books
- **When:** `This Book's Author's User = Current User`
- **Fields:** Allow all fields

- **Rule name:** Admin Full Access
- **When:** `Current User's role = "admin"`
- **Fields:** Allow all fields

- **Default:** No access

### NotificationLog Rules

- **Rule name:** Admin Only
- **When:** `Current User's role = "admin"`
- **Fields:** Allow all fields

- **Default:** No access

---

## Part 3: Page Structure

Create the following pages via **Pages → Add a new page**:

| Page Name | URL | Purpose |
|-----------|-----|---------|
| `index` | `/` | Login page (redirect based on role) |
| `author-books` | `/my-books` | Author's book list |
| `author-royalties` | `/royalties` | Consolidated royalty overview |
| `admin-dashboard` | `/admin` | Admin author list with filters |
| `admin-author-detail` | `/admin/author` | Single author detail view |

---

## Part 4: Author Portal

### Page: Login (`index`)

1. Add an **Email Input** and **Password Input**
2. Add a **Login Button**
3. Button workflow:
   - Action: Log the user in with `email` and `password`
   - On success: Navigate to `/author-books` if `Current User's role = "author"`, else navigate to `/admin`

### Page: My Books (`author-books`)

1. Add a **Repeating Group**:
   - Type: Book
   - Data source: Search for Books where `author = Current User's Author` (you'll need to search Author where User = Current User first, store in a custom state)
   - Sort by: title ascending

2. Inside each cell show:
   - Title (Text)
   - ISBN (Text)
   - Genre (Text)
   - Status with **colour badge** (see below)
   - Publication Date (formatted)
   - MRP (Number formatted as ₹)
   - Available On (join list with "," separator)

3. **Royalty Status Badge** — add a Text element with dynamic background colour:
   - Text: `Current cell's Book's status`
   - Background colour conditional:
     - When `royalty_pending = 0` → Green (#22c55e)
     - When `royalty_pending > 0` AND `last_royalty_payout_date` is within 90 days → Yellow (#eab308)
     - When `royalty_pending > 0` AND (`last_royalty_payout_date` is empty OR more than 90 days ago) → Red (#ef4444)

### Page: Royalty Overview (`author-royalties`)

1. Add a summary section at the top with these computed values:
   - Total Earned: sum of all books' `total_royalty_earned` filtered by current user's author
   - Total Paid: sum of `royalty_paid`
   - Total Pending: sum of `royalty_pending`

   > In Bubble, compute this using `:sum` operator on a Search for Books filtered by current author.

2. Add a **Repeating Group** for per-book royalty detail (same data source as above)

3. Inside each cell show per-book breakdown:
   - Total copies sold
   - Total royalty earned
   - Royalty paid
   - Royalty pending
   - Last payout date
   - Status badge (Green/Yellow/Red — same logic as above)

---

## Part 5: Admin Portal

### Page: Admin Dashboard (`admin-dashboard`)

1. Add **Filter Controls** at the top:
   - Dropdown: **Filter by City** (list of cities from database: Search Authors → Group by city)
   - Dropdown: **Filter by Payout Status** (Fully Paid / Pending / Overdue)
   - Text input: **Search by Author Name**

2. Add a **Repeating Group**:
   - Type: Author
   - Data source: Search for Authors (with dynamic constraints from filters)
   - For city filter: `constraint: city = Filter City Dropdown's value` (only when filter is set)
   - For name search: `constraint: name contains Search Input's value`

3. Inside each author cell show:
   - Author name (clickable → navigate to `/admin/author?author_id=Author's author_id`)
   - City
   - Total books: Search Books where author = Current cell's Author :count
   - Total earned: Search Books where author = Current cell's Author → total_royalty_earned :sum
   - Total pending: Search Books where author = Current cell's Author → royalty_pending :sum
   - Payout status badge

4. **Bulk Trigger Button** (top right of page):
   - Label: "Send Royalty Summary to All Pending Authors"
   - On click: Start a recurring workflow (or use a List of Authors custom state) → for each Author where royalty_pending > 0 → call the n8n webhook

### Page: Admin Author Detail (`admin-author-detail`)

1. On page load: Get the `author_id` from URL parameter → Search Authors where author_id = URL param → store in page state

2. Show author info at top (name, email, city, joined date, phone)

3. Add a **Repeating Group** for books (same data as author portal but for selected author)

4. Add a **"Generate & Send Royalty Summary" Button** per author (or in the header):
   - On click:
     1. Create a new NotificationLog entry (status = "Pending", author = current author, triggered_by = Current User, triggered_at = Current date/time)
     2. Call n8n webhook API (via API Connector) passing: `author_id`, `log_id` (the new log's _id), `bubble_base_url`, `bubble_api_key`
     3. Disable button while workflow is running
     4. On success: show "Summary sent!" toast
     5. On error: show error message, update log status to "Failed"

5. Add a **Notification Log Repeating Group** below the book list:
   - Type: NotificationLog
   - Filter: `author = Current page's Author`
   - Show: triggered_at, status (with colour badge), email_subject, completed_at, error_message

---

## Part 6: API Connector (Bubble Plugin)

### Install the API Connector Plugin
**Plugins → Add Plugins → API Connector → Install**

### Configure n8n Webhook API

1. Click "Add another API"
2. Name: `n8n BookLeaf Automation`
3. Authentication: None (we pass the key manually in headers)
4. Add a shared header:
   - Key: `x-api-key`
   - Value: `your_shared_secret_key_here`

5. Add a new API Call:
   - Name: `Trigger Royalty Summary`
   - Use as: Action
   - Method: POST
   - URL: `https://YOUR-N8N-WEBHOOK-URL/webhook/bookleaf-royalty-summary`
   - Body (JSON):
     ```json
     {
       "author_id": "<author_id>",
       "log_id": "<log_id>",
       "bubble_base_url": "https://YOUR-APP.bubbleapps.io/api/1.1/obj",
       "bubble_api_key": "YOUR_BUBBLE_API_KEY"
     }
     ```
   - Mark `author_id` and `log_id` as parameters (angle bracket syntax)

6. Click **Initialize call** to test connectivity

---

## Part 7: Royalty Status Badge Logic

The status badge (Green/Yellow/Red) is determined per book using Bubble's conditional formatting:

```
CONDITION 1 (Green - Fully Paid):
When: Current cell's Book's royalty_pending = 0
→ Background: #22c55e | Text: "Fully Paid" | Text color: white

CONDITION 2 (Red - Overdue - Never Paid):
When: Current cell's Book's royalty_pending > 0
  AND Current cell's Book's last_royalty_payout_date is empty
  AND Current cell's Book's status contains "Published"
  AND Current cell's Book's publication_date < Current date/time - 90 days
→ Background: #ef4444 | Text: "Overdue" | Text color: white

CONDITION 3 (Red - Overdue - Last Payout Old):
When: Current cell's Book's royalty_pending > 0
  AND Current cell's Book's last_royalty_payout_date < Current date/time - 90 days
→ Background: #ef4444 | Text: "Overdue" | Text color: white

CONDITION 4 (Yellow - Pending Normal):
When: Current cell's Book's royalty_pending > 0
→ Background: #eab308 | Text: "Pending" | Text color: white

DEFAULT (Grey - N/A for in-production books):
→ Background: #6b7280 | Text: Current cell's Book's status | Text color: white
```

> **Note:** In Bubble, use "Add conditional" on the element. Set conditions in priority order — Bubble applies the first matching condition.

---

## Part 8: Testing Checklist

- [ ] Author can log in and see ONLY their own books
- [ ] Author cannot access `/admin` routes (redirect to login or 404)
- [ ] Admin can see all 10 authors
- [ ] Admin can filter by city (e.g., Mumbai → shows only Priya Sharma)
- [ ] Admin can filter by payout status
- [ ] Admin can search by author name
- [ ] Clicking an author navigates to their detail page
- [ ] Author detail page shows correct book list and royalty figures
- [ ] "Generate & Send" button creates a NotificationLog entry with status "Pending"
- [ ] n8n is triggered and processes the author
- [ ] NotificationLog updates to "Success" with email_subject and email_body
- [ ] "Bulk Trigger" creates one log entry per eligible author
- [ ] Logging in as Priya Sharma → cannot see Rohit Kapoor's books
- [ ] Privacy rules verified by checking Bubble's debugger

---

*This guide covers the complete Bubble setup. For n8n setup, see `README.md`. For AI prompt strategy, see `prompt_strategy.md`.*
