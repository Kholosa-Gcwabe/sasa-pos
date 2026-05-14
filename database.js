const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// Cashier & Manager can create orders
router.post('/', authorize('Cashier', 'Manager'), orderController.createOrder);

// All roles can view orders
router.get('/', orderController.getOrders);
router.get('/active', authorize('Chef', 'Manager'), orderController.getActiveOrders);
router.get('/stats/today', authorize('Manager'), orderController.getTodayStats);
router.get('/:id', orderController.getOrderById);

// Chef & Manager can update status
router.put('/:id/status', authorize('Chef', 'Manager'), orderController.updateStatus);

// Manager only
router.put('/:id/cancel', authorize('Manager'), orderController.cancelOrder);

module.exports = router;
