# 📚 BookLeaf Author Support & Communication Portal

> A full-stack web application for BookLeaf Publishing — AI-powered author support ticket system with dual portals (Author & Admin).

---

## 🚀 Live Demo

> Run locally using the instructions below.

**Test Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookleafpub.com | admin123 |
| Admin | support@bookleafpub.com | support123 |
| Author (Priya Sharma) | priya.sharma@email.com | password123 |
| Author (Rohit Kapoor) | rohit.kapoor@email.com | password123 |
| Author (Sneha Kulkarni) | sneha.kulkarni@email.com | password123 |
| *(All 10 authors)* | *see below* | password123 |

---

## 🛠️ Setup & Running Locally

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone / Unzip the project

```bash
# Navigate into the project
cd BookLeafpub
```

### 2. Setup the Backend (Server)

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy the example)
copy .env.example .env
```

Edit `server/.env` and set your values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookleaf
JWT_SECRET=bookleaf_secret_jwt_key_2026_very_long_and_secure
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key_here   ← Add your Gemini API key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Get a free Gemini API key:** https://aistudio.google.com/app/apikey

```bash
# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

Server will run at: `http://localhost:5000`

### 3. Setup the Frontend (Client)

```bash
cd ../client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 📁 Project Structure

```
BookLeafpub/
├── server/                    # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── book.controller.js
│   │   │   ├── ticket.controller.js
│   │   │   └── admin.controller.js
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.model.js
│   │   │   ├── Book.model.js
│   │   │   └── Ticket.model.js
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # JWT auth, RBAC
│   │   ├── services/
│   │   │   └── ai.service.js  # Gemini AI integration
│   │   └── seeds/
│   │       └── seed.js        # Database seeder
│   ├── .env
│   └── package.json
│
└── client/                    # React + Vite Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── author/        # Author-facing pages
    │   │   └── admin/         # Admin-facing pages
    │   ├── layouts/           # AuthorLayout, AdminLayout
    │   ├── contexts/          # AuthContext (JWT)
    │   ├── services/          # api.js, socket.js
    │   └── components/        # Shared components (Badges)
    ├── .env
    └── package.json
```

---

## 🏗️ Architecture Decisions

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast DX, component reusability, SPA routing |
| Backend | Node.js + Express | Lightweight, fast I/O, large ecosystem |
| Database | MongoDB + Mongoose | Flexible schema for tickets/responses, embedded subdocuments |
| Auth | JWT (jsonwebtoken) | Stateless, scalable, easy RBAC implementation |
| Real-time | Socket.io | Mature, reliable WebSocket abstraction |
| AI | Google Gemini 1.5 Flash | Cost-effective ($0.075/1M tokens), fast, high quality |
| HTTP Client | Axios | Interceptors for 401 handling, clean API wrapper |

### Key Design Decisions

1. **Embedded Responses in Tickets** — Ticket responses are embedded subdocuments in MongoDB rather than a separate collection. This avoids joins and keeps the ticket + conversation together, which is the natural access pattern.

2. **Separation of Concerns** — Controllers handle business logic, routes handle HTTP endpoints, models define schema, services handle external integrations. No logic in routes.

3. **Role-Based Access Control** — Two middleware functions: `protect` (validates JWT) and `authorize(...roles)` (checks role). Applied at the route level, not controller level.

4. **Socket.io Room Architecture**:
   - Authors join `author-{userId}` room → receive notifications for their own tickets only
   - Admins join `admin-room` → receive notifications for all new tickets

---

## 🤖 AI Integration Details

### Model Choice: Google Gemini 1.5 Flash
- **Cost**: ~$0.075/1M input tokens vs GPT-4o-mini's ~$0.15/1M — 50% cheaper
- **Speed**: Sub-2-second response times for classification
- **Quality**: Excellent instruction following for structured JSON classification

### Prompt Strategy

**Classification Prompt** — Returns structured JSON only (no markdown), with explicit category list to prevent hallucination:
```
{"category": "...", "priority": "...", "reasoning": "..."}
```

**Draft Response Prompt** — Injects:
1. Full BookLeaf Knowledge Base (company policies, tone guidelines)
2. Only the **relevant book's data** (not the entire author library) — cost-aware
3. Explicit length constraint (200-350 words)
4. Anti-filler instructions ("Don't use 'Great question!'")

### Cost Awareness
- Only the related book's data is sent per AI call (not the whole catalog)
- Draft responses are cached in the database for 1 hour — repeated admin views don't trigger new API calls
- Classification happens once at ticket creation, never again unless manually overridden
- Knowledge base is injected via the system prompt-equivalent context (not repeated per conversation history)

### Graceful Degradation
- If `GEMINI_API_KEY` is not set → AI initializes in fallback mode
- Ticket creation succeeds with default category/priority (`General Inquiry / Medium`)
- AI draft returns `null` → admin sees "AI unavailable, write manually" message
- No 500 errors — all AI failures are caught and logged

### Security
- API key stored in `.env`, never exposed to frontend
- Frontend only calls `/api/admin/tickets/:id/ai-draft` (server-side to AI)
- Admin-only route — authors cannot trigger AI calls

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication
All protected routes require: `Authorization: Bearer <token>`

---

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/register` | Public | Register new user |
| GET | `/auth/me` | Private | Get current user profile |

**POST /auth/login**
```json
{ "email": "priya.sharma@email.com", "password": "password123" }
```
Response: `{ success, token, user: { id, name, email, role } }`

---

### Author Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/books/my-books` | Author | Get all books with royalty summary |
| GET | `/books/:id` | Author | Get single book |
| POST | `/tickets` | Author | Create new ticket |
| GET | `/tickets/my-tickets` | Author | Get own tickets |
| GET | `/tickets/:id` | Author | Get single ticket (own only) |

---

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/tickets` | Admin | All tickets (filterable) |
| GET | `/admin/tickets/:id` | Admin | Single ticket detail |
| PATCH | `/admin/tickets/:id` | Admin | Update status/category/priority |
| POST | `/admin/tickets/:id/respond` | Admin | Send response or internal note |
| GET | `/admin/tickets/:id/ai-draft` | Admin | Get AI-generated draft response |
| GET | `/admin/authors` | Admin | All registered authors |
| GET | `/admin/books` | Admin | All books |

**Query params for GET /admin/tickets:**
- `status` — Open | In Progress | Resolved | Closed
- `category` — e.g., "Royalty & Payments"
- `priority` — Critical | High | Medium | Low
- `search` — searches subject, author name, ticket ID
- `page`, `limit` — pagination
- `assignedToMe` — true/false

---

### AI Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ai/status` | Private | Check if AI is operational |
| POST | `/ai/classify` | Admin | Classify a ticket manually |

---

## ⚠️ Known Limitations & Future Improvements

1. **File Uploads** — Attachment UI is present but upload is not implemented (bonus feature per assignment spec). Would use S3/Cloudinary + multer.

2. **Email Notifications** — No email sent when admin responds. Would add Nodemailer/SendGrid.

3. **Pagination in Author View** — Author's ticket list loads all at once. Needs pagination for authors with many tickets.

4. **Search** — Admin search is server-side; a production system would use MongoDB Atlas Search or Elasticsearch.

5. **Refresh Token** — Currently using long-lived JWTs (7 days). Production should use refresh token rotation.

6. **Deployment** — Not deployed yet. Would use Railway (backend) + Vercel (frontend) + MongoDB Atlas.

---

## 👥 All Test Author Accounts

| Author | Email | Password |
|--------|-------|----------|
| Priya Sharma | priya.sharma@email.com | password123 |
| Rohit Kapoor | rohit.kapoor@email.com | password123 |
| Ananya Reddy | ananya.reddy@email.com | password123 |
| Vikram Joshi | vikram.joshi@email.com | password123 |
| Meera Nair | meera.nair@email.com | password123 |
| Arjun Malhotra | arjun.malhotra@email.com | password123 |
| Sneha Kulkarni | sneha.kulkarni@email.com | password123 |
| Farhan Sheikh | farhan.sheikh@email.com | password123 |
| Kavita Deshmukh | kavita.deshmukh@email.com | password123 |
| Diya Chatterjee | diya.chatterjee@email.com | password123 |
