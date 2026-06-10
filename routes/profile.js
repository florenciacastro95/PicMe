const express = require('express');
const router = express.Router();
const profileController =require('../controllers/profileController');

router.get('/:username/followers', profileController.followers);
router.get('/:username/following', profileController.following);
router.get('/:username', profileController.show);

module.exports = router;