const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        bookId: {
            type: String,
            required: true,
            unique: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        authorId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
        },
        isbn: {
            type: String,
            required: true,
            unique: true,
        },
        genre: {
            type: String,
            trim: true,
        },
        publicationDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: [
                'Published & Live',
                'In Production - Cover Design',
                'In Production - Typesetting',
                'In Production - Proofreading',
                'In Production - ISBN Assignment',
                'In Production - Printing',
                'In Production - Distribution Setup',
                'Manuscript Received',
                'In Editing',
            ],
            default: 'Manuscript Received',
        },
        mrp: {
            type: Number,
        },
        authorRoyaltyPerCopy: {
            type: Number,
        },
        totalCopiesSold: {
            type: Number,
            default: 0,
        },
        totalRoyaltyEarned: {
            type: Number,
            default: 0,
        },
        royaltyPaid: {
            type: Number,
            default: 0,
        },
        royaltyPending: {
            type: Number,
            default: 0,
        },
        lastRoyaltyPayoutDate: {
            type: Date,
        },
        printPartner: {
            type: String,
            enum: ['In-House', 'Repro India', 'Epitome Books', null],
        },
        availableOn: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
