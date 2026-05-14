const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Validation rules
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Cashier', 'Chef', 'Manager'])
    .withMessage('Invalid role')
];

// Routes
router.post('/login', loginValidation, authController.login);
router.post('/register', authenticate, registerValidation, authController.register);
router.get('/me', authenticate, authController.getMe);
router.put('/password', authenticate, authController.changePassword);

module.exports = router;
