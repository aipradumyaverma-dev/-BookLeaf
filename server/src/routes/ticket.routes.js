const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getTicketById } = require('../controllers/ticket.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

/**
 * @route   POST /api/tickets
 * @desc    Create a new support ticket
 * @access  Private (Author)
 */
router.post('/', authorize('author'), createTicket);

/**
 * @route   GET /api/tickets/my-tickets
 * @desc    Get all tickets for logged-in author
 * @access  Private (Author)
 */
router.get('/my-tickets', authorize('author'), getMyTickets);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get single ticket (author sees their own only)
 * @access  Private
 */
router.get('/:id', getTicketById);

module.exports = router;
