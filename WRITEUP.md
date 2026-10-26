# BookLeaf Author Support Portal — Brief Write-Up

**Candidate:** Full-Stack Developer Applicant  
**Assignment:** Technical Assignment 1 of 2  
**Date:** October 2026

---

## What I Prioritised

Given the evaluation criteria (AI Integration 25%, Architecture 25%, API Design 15%, Functionality 15%), I deliberately sequenced my work as follows:

1. **AI Integration first** — I designed the AI service (`ai.service.js`) before writing a single API endpoint. This forced me to think through the knowledge base injection, graceful fallback, and cost management upfront, rather than bolting AI on at the end.

2. **Core ticket lifecycle** — The full ticket flow (submit → auto-classify → AI draft → admin respond → real-time update to author) was prioritised over nice-to-have features like email notifications.

3. **Clean API design** — Role-based middleware (`protect` + `authorize`) applied uniformly at the route level. Consistent error response shapes. Meaningful HTTP status codes throughout.

---

## Trade-offs Made

| Decision | What I chose | What I sacrificed |
|----------|-------------|-------------------|
| **AI model** | Gemini 1.5 Flash | GPT-4o quality ceiling (Gemini is slightly lower) |
| **Real-time** | Socket.io | SSE (simpler but unidirectional) |
| **Database** | MongoDB | PostgreSQL schema strictness (offset by Mongoose validation) |
| **Auth** | JWT (stateless) | Session-based (easier revocation) |
| **File upload** | UI only | Actual S3 upload (time constraint) |

---

## How I'd Evolve This Into a Production System

**Immediate (before shipping):**
- S3/Cloudinary for actual file attachments
- SendGrid for email notifications when admin responds
- Refresh token rotation (replace long-lived JWTs)
- Rate limiting on AI endpoints (`express-rate-limit`)
- Input sanitisation (`DOMPurify` equivalent server-side)

**Short-term (month 1):**
- Deploy: Railway (backend) + Vercel (frontend) + MongoDB Atlas
- Add webhook-based AI classification trigger (process asynchronously via queue rather than blocking ticket creation)
- Author feedback rating on responses (thumbs up/down)
- Admin SLA tracking: flag tickets approaching 48h without response

**Medium-term (quarter 1):**
- Switch AI classification to a fine-tuned model trained on BookLeaf's actual historical tickets — dramatically improves accuracy for edge cases
- Full-text search via MongoDB Atlas Search or Elasticsearch
- Analytics dashboard: response time averages, category trends, resolution rates
- Mobile-responsive redesign for authors on the go

**Architecture evolution:**
- Extract AI service into a separate microservice — allows independent scaling during high volume periods and swapping models without touching core API
- Event-driven ticket processing via Redis Streams — decouple ticket creation from classification/notification side-effects
- CQRS pattern for read-heavy dashboard queries

---

## AI Integration Approach

The key decision was **what context to send vs. what to leave out**. 

For classification, I send only the ticket content — no book data needed. The prompt returns forced JSON to prevent hallucination on category names.

For draft responses, I inject:
- The full knowledge base (fixed cost — always needed for policy accuracy)
- Only the *related book's* data, not the entire author catalog (variable cost — controlled)

This keeps average input tokens under ~800 per draft call, making each draft cost roughly $0.00006 at Gemini Flash rates — negligible even at scale.

The 1-hour cache on AI drafts ensures that if an admin opens, closes, and reopens a ticket, we don't burn a new API call.
