const express = require('express');
const router = express.Router();
const { getMyBooks, getBookById } = require('../controllers/book.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

/**
 * @route   GET /api/books/my-books
 * @desc    Get all books for logged-in author
 * @access  Private (Author)
 */
router.get('/my-books', authorize('author'), getMyBooks);

/**
 * @route   GET /api/books/:id
 * @desc    Get single book by ID (author only sees their own)
 * @access  Private (Author)
 */
router.get('/:id', authorize('author'), getBookById);

module.exports = router;
