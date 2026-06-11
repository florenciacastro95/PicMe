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
    postController.create);

router.get('/:id',
    postController.show);

router.get('/:id/edit',
    isAuthenticated, upload.array('imagenes', 10),
    postController.showEdit);

router.post('/:id/edit',
    isAuthenticated,
    upload.array('imagenes', 10),
    postController.update);

router.post('/:id/delete',
    isAuthenticated,
    postController.destroy);

router.post(
    '/:id/habcomments',
    isAuthenticated,
    postController.changeComments
);
module.exports = router;