const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { isNotAuthenticated } = require('../middlewares/auth');

router.get('/login', isNotAuthenticated, authController.showLogin);
router.post('/login', isNotAuthenticated, authController.login);

router.get('/register', isNotAuthenticated, authController.showRegister);
router.post('/register', isNotAuthenticated, authController.register);

router.get('/logout', authController.logout);
module.exports = router;