const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middlewares/auth');

router.post(
    '/:id',
    isAuthenticated,
    commentController.create
);

router.post(
    '/:id/delete',
    isAuthenticated,
    commentController.destroy
);

module.exports = router;