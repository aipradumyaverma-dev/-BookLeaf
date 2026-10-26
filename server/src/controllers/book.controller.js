const Book = require('../models/Book.model');

// @desc    Get books for logged-in author
// @route   GET /api/books/my-books
// @access  Private (Author)
const getMyBooks = async (req, res, next) => {
    try {
        const books = await Book.find({ author: req.user._id }).sort({ createdAt: -1 });

        const summary = {
            totalBooks: books.length,
            publishedBooks: books.filter((b) => b.status === 'Published & Live').length,
            inProductionBooks: books.filter((b) => b.status !== 'Published & Live').length,
            totalCopiesSold: books.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0),
            totalRoyaltyEarned: books.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0),
            totalRoyaltyPaid: books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0),
            totalRoyaltyPending: books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0),
        };

        res.json({ success: true, books, summary });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single book by ID (author can only access their own)
// @route   GET /api/books/:id
// @access  Private (Author)
const getBookById = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, author: req.user._id });
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found.' });
        }
        res.json({ success: true, book });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyBooks, getBookById };
