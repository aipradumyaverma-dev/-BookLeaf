const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { generateDraftResponse, classifyTicket } = require('../services/ai.service');

/**
 * @route   POST /api/ai/classify
 * @desc    Classify a ticket (test endpoint)
 * @access  Private (Admin)
 */
router.post('/classify', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { subject, description, bookTitle } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ success: false, message: 'Subject and description are required' });
        }
        const result = await classifyTicket(subject, description, bookTitle);
        res.json({ success: true, result });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /api/ai/status
 * @desc    Check if AI service is available
 * @access  Private
 */
router.get('/status', protect, (req, res) => {
    const isAvailable = !!(
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    );
    res.json({
        success: true,
        aiAvailable: isAvailable,
        model: isAvailable ? 'gemini-1.5-flash' : null,
        message: isAvailable ? 'AI service is operational' : 'AI key not configured',
    });
});

module.exports = router;
