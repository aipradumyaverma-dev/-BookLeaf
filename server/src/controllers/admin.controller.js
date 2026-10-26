const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket.model');
const Book = require('../models/Book.model');
const User = require('../models/User.model');
const { generateDraftResponse, classifyTicket } = require('../services/ai.service');

// @desc    Get all tickets (with filters)
// @route   GET /api/admin/tickets
// @access  Private (Admin)
const getAllTickets = async (req, res, next) => {
    try {
        const { status, category, priority, page = 1, limit = 20, search, assignedToMe } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (assignedToMe === 'true') filter.assignedTo = req.user._id;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { authorName: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Ticket.countDocuments(filter);

        const tickets = await Ticket.find(filter)
            .populate('book', 'title isbn')
            .populate('author', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            tickets,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all authors (admin)
// @route   GET /api/admin/authors
// @access  Private (Admin)
const getAllAuthors = async (req, res, next) => {
    try {
        const authors = await User.find({ role: 'author' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, authors, total: authors.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Update ticket status, category, priority
// @route   PATCH /api/admin/tickets/:id
// @access  Private (Admin)
const updateTicket = async (req, res, next) => {
    try {
        const { status, category, priority, assignedTo } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        // Track if admin is overriding AI classifications
        if (category && category !== ticket.category) {
            ticket.categoryOverridden = true;
            ticket.category = category;
        }
        if (priority && priority !== ticket.priority) {
            ticket.priorityOverridden = true;
            ticket.priority = priority;
        }
        if (status) ticket.status = status;

        if (assignedTo) {
            const admin = await User.findById(assignedTo);
            if (admin) {
                ticket.assignedTo = admin._id;
                ticket.assignedToName = admin.name;
            }
        }

        await ticket.save();

        // Real-time notification to author
        const io = req.app.get('io');
        if (io) {
            io.to(`author-${ticket.author}`).emit('ticket-updated', {
                ticketId: ticket.ticketId,
                status: ticket.status,
                updatedAt: ticket.updatedAt,
            });
            io.to('admin-room').emit('ticket-updated', {
                _id: ticket._id,
                ticketId: ticket.ticketId,
                status: ticket.status,
            });
        }

        res.json({ success: true, message: 'Ticket updated', ticket });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a response to a ticket
// @route   POST /api/admin/tickets/:id/respond
// @access  Private (Admin)
const respondToTicket = [
    body('message').trim().notEmpty().withMessage('Response message is required'),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { message, isInternal = false } = req.body;

            const ticket = await Ticket.findById(req.params.id);
            if (!ticket) {
                return res.status(404).json({ success: false, message: 'Ticket not found.' });
            }

            const response = {
                responder: req.user._id,
                responderName: req.user.name,
                responderRole: 'admin',
                message,
                isInternal: Boolean(isInternal),
            };

            ticket.responses.push(response);

            // Update status to In Progress if it's open and not internal note
            if (!isInternal && ticket.status === 'Open') {
                ticket.status = 'In Progress';
            }

            await ticket.save();

            // Real-time notification
            const io = req.app.get('io');
            if (io && !isInternal) {
                io.to(`author-${ticket.author}`).emit('ticket-response', {
                    ticketId: ticket.ticketId,
                    ticketDbId: ticket._id,
                    message,
                    responderName: req.user.name,
                    createdAt: new Date().toISOString(),
                });
                io.to('admin-room').emit('ticket-updated', {
                    _id: ticket._id,
                    ticketId: ticket.ticketId,
                    status: ticket.status,
                });
            }

            res.json({ success: true, message: 'Response sent', ticket });
        } catch (error) {
            next(error);
        }
    },
];

// @desc    Generate AI draft response for a ticket
// @route   GET /api/admin/tickets/:id/ai-draft
// @access  Private (Admin)
const getAiDraft = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('book', 'title isbn status');
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found.' });
        }

        // Check if we already have a fresh cached draft (within 1 hour)
        if (
            ticket.aiDraftResponse &&
            ticket.aiDraftGeneratedAt &&
            Date.now() - ticket.aiDraftGeneratedAt.getTime() < 3600000
        ) {
            return res.json({
                success: true,
                draft: ticket.aiDraftResponse,
                cached: true,
                generatedAt: ticket.aiDraftGeneratedAt,
            });
        }

        // Get author's books for context (cost-aware: only books related to the ticket)
        const Book = require('../models/Book.model');
        let authorBooks = [];
        if (ticket.book) {
            const relatedBook = await Book.findById(ticket.book);
            if (relatedBook) authorBooks = [relatedBook];
        }

        const draft = await generateDraftResponse(ticket, authorBooks);

        if (draft) {
            ticket.aiDraftResponse = draft;
            ticket.aiDraftGeneratedAt = new Date();
            await ticket.save();
        }

        res.json({
            success: true,
            draft: draft || null,
            aiAvailable: !!draft,
            message: draft ? 'AI draft generated' : 'AI unavailable. Please write response manually.',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
    try {
        const [totalTickets, openTickets, inProgressTickets, resolvedTickets, totalAuthors, totalBooks] =
            await Promise.all([
                Ticket.countDocuments(),
                Ticket.countDocuments({ status: 'Open' }),
                Ticket.countDocuments({ status: 'In Progress' }),
                Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
                User.countDocuments({ role: 'author' }),
                Book.countDocuments(),
            ]);

        const categoryStats = await Ticket.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        const priorityStats = await Ticket.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]);

        const recentTickets = await Ticket.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('ticketId subject authorName priority status createdAt category');

        res.json({
            success: true,
            stats: {
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
                totalAuthors,
                totalBooks,
                categoryStats,
                priorityStats,
                recentTickets,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all books (admin view)
// @route   GET /api/admin/books
// @access  Private (Admin)
const getAllBooks = async (req, res, next) => {
    try {
        const books = await Book.find().populate('author', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, books, total: books.length });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTickets,
    getAllAuthors,
    updateTicket,
    respondToTicket,
    getAiDraft,
    getDashboardStats,
    getAllBooks,
};
