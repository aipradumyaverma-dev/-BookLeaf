const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
    {
        responder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        responderName: String,
        responderRole: {
            type: String,
            enum: ['author', 'admin'],
        },
        message: {
            type: String,
            required: true,
        },
        isInternal: {
            type: Boolean,
            default: false, // Internal notes not visible to author
        },
        isAiDraft: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        authorName: String,
        authorEmail: String,
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            default: null,
        },
        bookTitle: {
            type: String,
            default: 'General / Account Level',
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open',
        },
        category: {
            type: String,
            enum: [
                'Royalty & Payments',
                'ISBN & Metadata Issues',
                'Printing & Quality',
                'Distribution & Availability',
                'Book Status & Production Updates',
                'General Inquiry',
            ],
            default: 'General Inquiry',
        },
        priority: {
            type: String,
            enum: ['Critical', 'High', 'Medium', 'Low'],
            default: 'Medium',
        },
        aiCategory: String,  // AI suggested category before admin override
        aiPriority: String, // AI suggested priority before admin override
        categoryOverridden: {
            type: Boolean,
            default: false,
        },
        priorityOverridden: {
            type: Boolean,
            default: false,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedToName: String,
        responses: [responseSchema],
        attachments: [String], // File paths
        aiDraftResponse: String,
        aiDraftGeneratedAt: Date,
    },
    { timestamps: true }
);

// Auto-generate ticket ID
ticketSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        const count = await mongoose.model('Ticket').countDocuments();
        this.ticketId = `TKT-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
