const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini only if API key is present
let genAI = null;
let model = null;

const initializeAI = () => {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini AI initialized');
    } else {
        console.warn('⚠️  GEMINI_API_KEY not set. AI features will use fallback mode.');
    }
};

initializeAI();

// ─── BookLeaf Knowledge Base (injected into prompts) ────────────────────────
const KNOWLEDGE_BASE = `
BOOKLEAF PUBLISHING - KNOWLEDGE BASE FOR SUPPORT RESPONSES

COMPANY OVERVIEW:
- BookLeaf Publishing is a self-publishing company in India and US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium with marketing/distribution add-ons).
- Services: Cover design, typesetting, ISBN assignment, printing, distribution, royalty management.
- In-house printing facility and warehouse in Delhi. Print partners: Repro India, Epitome Books.

ROYALTY POLICY:
- 80/20 split: 80% net profit to author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties calculated quarterly, paid within 45 days of quarter ending.
- Minimum payout threshold: ₹1,000. Below this rolls over to next quarter.
- Payouts via bank transfer linked in author's dashboard.
- Authors can view detailed royalty breakdown per platform.

ISBN POLICY:
- Every book gets a unique ISBN under BookLeaf's publisher imprint.
- Author-owned imprint ISBNs must be obtained independently.
- ISBN errors (duplicate, wrong book linked) = high-priority, escalated to production team immediately.

PRINTING & QUALITY:
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, color inconsistency) → free reprint after photo verification.

DISTRIBUTION & AVAILABILITY:
- Listed on: Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- New listings go live within 7–10 business days after publication.
- "Currently Unavailable" = stock sync issue → team triggers re-sync within 24–48 hours.

PRODUCTION STAGES:
Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live
- Authors updated via email at each stage.
- Common delays: Cover Design (waiting for author approval) and Proofreading (revision rounds).

COMMUNICATION TONE GUIDELINES:
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge concern before giving solutions.
- Be specific: include actual numbers, dates, statuses.
- Own BookLeaf's mistakes directly. No corporate deflection.
- If escalation needed, give a clear timeline (e.g., "Our team will look into this within 48 hours").
- Always end with a clear next step for the author and/or the BookLeaf team.
- Sign off as: "BookLeaf Author Support Team"
`;

// ─── CATEGORY CLASSIFICATION ────────────────────────────────────────────────
const VALID_CATEGORIES = [
    'Royalty & Payments',
    'ISBN & Metadata Issues',
    'Printing & Quality',
    'Distribution & Availability',
    'Book Status & Production Updates',
    'General Inquiry',
];

const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Classify a ticket's category and priority using AI
 */
const classifyTicket = async (subject, description, bookTitle = null) => {
    const fallback = {
        category: 'General Inquiry',
        priority: 'Medium',
        reasoning: 'AI classification unavailable. Manual review required.',
    };

    if (!model) return fallback;

    try {
        const prompt = `You are a support ticket classifier for BookLeaf Publishing.

Analyze this support ticket and respond with ONLY a valid JSON object (no markdown, no explanation):

Ticket Subject: "${subject}"
Ticket Description: "${description}"
${bookTitle ? `Related Book: "${bookTitle}"` : 'Book: General / Account Level'}

Classify into ONE category from this exact list:
- Royalty & Payments
- ISBN & Metadata Issues
- Printing & Quality
- Distribution & Availability
- Book Status & Production Updates
- General Inquiry

Assign ONE priority based on urgency:
- Critical: Financial loss, wrong ISBN, severe quality issues, prolonged no-payment
- High: Royalty discrepancies, distribution failures, major delays
- Medium: Status questions, moderate delays, metadata updates
- Low: General inquiries, minor questions

Respond ONLY with this exact JSON format:
{"category": "...", "priority": "...", "reasoning": "..."}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response format');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'General Inquiry',
            priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium',
            reasoning: parsed.reasoning || 'AI classification',
        };
    } catch (error) {
        console.error('AI classification error:', error.message);
        return fallback;
    }
};

/**
 * Generate an AI draft response for a ticket
 */
const generateDraftResponse = async (ticket, authorBooks = []) => {
    const fallback = null; // Graceful degradation - admin writes manually

    if (!model) return fallback;

    try {
        // Build minimal context (cost-aware: only send what's needed)
        const bookContext = authorBooks.length > 0
            ? `Author's Books:\n${authorBooks.map(b =>
                `- "${b.title}" (ISBN: ${b.isbn}) | Status: ${b.status} | Sold: ${b.totalCopiesSold} copies | Royalty Earned: ₹${b.totalRoyaltyEarned} | Paid: ₹${b.royaltyPaid} | Pending: ₹${b.royaltyPending}`
            ).join('\n')}`
            : '';

        const prompt = `You are a support representative at BookLeaf Publishing. Draft a professional, empathetic response to this author support ticket.

${KNOWLEDGE_BASE}

TICKET DETAILS:
Author: ${ticket.authorName}
Subject: ${ticket.subject}
Category: ${ticket.category}
Priority: ${ticket.priority}
${ticket.bookTitle !== 'General / Account Level' ? `Related Book: ${ticket.bookTitle}` : ''}
${bookContext}

Author's Message:
"${ticket.description}"

INSTRUCTIONS:
1. Start by acknowledging the author's concern warmly.
2. Address their specific issue with accurate information from the knowledge base.
3. Include specific next steps or timelines where applicable.
4. Be honest if something requires investigation - commit to a 48-hour response timeline.
5. End with a clear call to action.
6. Sign off as "BookLeaf Author Support Team".
7. Keep the response concise (200-350 words max).
8. Do NOT use generic AI filler phrases like "Great question!" or "Certainly!".

Draft the response now:`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('AI draft generation error:', error.message);
        return null; // Graceful degradation
    }
};

module.exports = { classifyTicket, generateDraftResponse, KNOWLEDGE_BASE, initializeAI };
