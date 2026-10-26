const express = require('express');
const router = express.Router();
const {
    getAllTickets,
    getAllAuthors,
    updateTicket,
    respondToTicket,
    getAiDraft,
    getDashboardStats,
    getAllBooks,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all tickets with optional filters
 * @query   status, category, priority, page, limit, search, assignedToMe
 * @access  Private (Admin)
 */
router.get('/tickets', getAllTickets);

/**
 * @route   PATCH /api/admin/tickets/:id
 * @desc    Update ticket status, category, priority, or assignment
 * @access  Private (Admin)
 */
router.patch('/tickets/:id', updateTicket);

/**
 * @route   POST /api/admin/tickets/:id/respond
 * @desc    Send a response to a ticket (admin)
 * @access  Private (Admin)
 */
router.post('/tickets/:id/respond', respondToTicket);

/**
 * @route   GET /api/admin/tickets/:id/ai-draft
 * @desc    Get AI-generated draft response for a ticket
 * @access  Private (Admin)
 */
router.get('/tickets/:id/ai-draft', getAiDraft);

/**
 * @route   GET /api/admin/tickets/:id
 * @desc    Get single ticket details (admin)
 * @access  Private (Admin)
 */
const { getTicketById } = require('../controllers/ticket.controller');
router.get('/tickets/:id', getTicketById);

/**
 * @route   GET /api/admin/authors
 * @desc    Get all registered authors
 * @access  Private (Admin)
 */
router.get('/authors', getAllAuthors);

/**
 * @route   GET /api/admin/books
 * @desc    Get all books across all authors
 * @access  Private (Admin)
 */
router.get('/books', getAllBooks);

module.exports = router;
