const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket.model');
const Book = require('../models/Book.model');
const { classifyTicket, generateDraftResponse } = require('../services/ai.service');

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private (Author)
const createTicket = [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { subject, description, bookId } = req.body;

            let book = null;
            let bookTitle = 'General / Account Level';

            if (bookId && bookId !== 'general') {
                book = await Book.findOne({ _id: bookId, author: req.user._id });
                if (!book) {
                    return res.status(404).json({ success: false, message: 'Book not found or not yours.' });
                }
                bookTitle = book.title;
            }

            // AI classification (non-blocking - ticket is created regardless)
            const aiResult = await classifyTicket(subject, description, bookTitle);

            const ticket = await Ticket.create({
                author: req.user._id,
                authorName: req.user.name,
                authorEmail: req.user.email,
                book: book ? book._id : null,
                bookTitle,
                subject,
                description,
                category: aiResult.category,
                priority: aiResult.priority,
                aiCategory: aiResult.category,
                aiPriority: aiResult.priority,
            });

            // Emit real-time event to admin room
            const io = req.app.get('io');
            if (io) {
                io.to('admin-room').emit('new-ticket', {
                    ticketId: ticket.ticketId,
                    subject: ticket.subject,
                    authorName: ticket.authorName,
                    priority: ticket.priority,
                    category: ticket.category,
                    createdAt: ticket.createdAt,
                });
            }

            res.status(201).json({
                success: true,
                message: 'Ticket submitted successfully',
                ticket,
                aiClassification: aiResult,
            });
        } catch (error) {
            next(error);
        }
    },
];

// @desc    Get all tickets for logged-in author
// @route   GET /api/tickets/my-tickets
// @access  Private (Author)
const getMyTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find({ author: req.user._id })
            .populate('book', 'title isbn')
            .sort({ createdAt: -1 });

        // Filter out internal notes from responses
        const sanitized = tickets.map((t) => {
            const obj = t.toObject();
            obj.responses = obj.responses.filter((r) => !r.isInternal);
            return obj;
        });

        res.json({ success: true, tickets: sanitized, total: sanitized.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single ticket (author can only access their own)
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res, next) => {
    try {
        const query = req.user.role === 'author'
            ? { _id: req.params.id, author: req.user._id }
            : { _id: req.params.id };

        const ticket = await Ticket.findOne(query).populate('book', 'title isbn').populate('assignedTo', 'name email');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        const obj = ticket.toObject();

        // Hide internal notes from authors
        if (req.user.role === 'author') {
            obj.responses = obj.responses.filter((r) => !r.isInternal);
        }

        res.json({ success: true, ticket: obj });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTicket, getMyTickets, getTicketById };
