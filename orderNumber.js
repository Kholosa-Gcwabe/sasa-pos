const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// All authenticated users can view menu
router.get('/', menuController.getMenuItems);

// Manager only for modifications
router.post('/', authorize('Manager'), menuController.createMenuItem);
router.put('/:id', authorize('Manager'), menuController.updateMenuItem);
router.delete('/:id', authorize('Manager'), menuController.deleteMenuItem);

module.exports = router;
