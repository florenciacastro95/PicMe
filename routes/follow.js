const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/feed', isAuthenticated, followController.feed);
router.post('/:userId', isAuthenticated, followController.follow);
router.post('/:userId/unfollow', isAuthenticated, followController.unfollow);

module.exports = router;