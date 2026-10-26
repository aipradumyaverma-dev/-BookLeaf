const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User.model');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// @desc    Register a new user (admin use or seeding)
// @route   POST /api/auth/register
// @access  Public
const register = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { name, email, password, role = 'author', phone, city } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Email already registered.' });
            }

            const user = await User.create({ name, email, password, role, phone, city });
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    authorId: user.authorId,
                },
            });
        } catch (error) {
            next(error);
        }
    },
];

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),

    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password.',
                });
            }

            if (!user.isActive) {
                return res.status(401).json({ success: false, message: 'Account is disabled.' });
            }

            const token = generateToken(user._id);

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    authorId: user.authorId,
                    city: user.city,
                    phone: user.phone,
                },
            });
        } catch (error) {
            next(error);
        }
    },
];

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                authorId: user.authorId,
                city: user.city,
                phone: user.phone,
                joinedDate: user.joinedDate,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
