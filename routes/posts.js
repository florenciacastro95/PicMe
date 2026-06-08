const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const postController = require('../controllers/postController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/create',
    isAuthenticated,
    postController.showCreate);

router.post('/create',
    isAuthenticated,
    upload.array('imagenes', 10),
    postController.create);

router.get('/:id',
    postController.show);

router.get('/:id/edit',
    isAuthenticated,
    postController.showEdit);

router.post('/:id/edit',
    isAuthenticated,
    upload.array('imagenes', 10),
    postController.update);

router.post('/:id/delete',
    isAuthenticated,
    postController.destroy);

module.exports = router;