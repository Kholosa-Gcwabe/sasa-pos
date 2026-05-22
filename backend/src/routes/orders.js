const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('Cashier', 'Manager'), orderController.createOrder);
router.get('/active', authenticate, authorize('Chef', 'Manager'), orderController.getActiveOrders);
router.get('/stats/today', authenticate, authorize('Manager'), orderController.getTodayStats);
router.get('/', authenticate, authorize('Manager'), orderController.getAllOrders);
router.put('/:id/status', authenticate, authorize('Chef', 'Manager'), orderController.updateStatus);

module.exports = router;
