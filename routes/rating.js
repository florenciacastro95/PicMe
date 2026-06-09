const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { isAuthenticated } = require('../middlewares/auth'); 

router.post('/imagen/:imagenId', isAuthenticated, ratingController.rate);

module.exports = router;