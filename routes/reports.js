
const express = require('express');
const router = express.Router();

const reportsController = require('../controllers/reportsController');

const {
    isAuthenticated,
    isValidator
} = require('../middlewares/auth');



//un usuario registrado puede denunciar una imagen
router.post(
    '/images/:imageId',
    isAuthenticated,
    reportsController.createImageReport
);

//un usuario registrado puede denunciar un comentario
router.post(
    '/comments/:commentId',
    isAuthenticated,
    reportsController.createCommentReport
);

//el controlador filtra las denuncias para mostrar solo las pertenecientes a las publicaciones del autor
router.get(
    '/comments',
    isAuthenticated,
    reportsController.commentReports
);


//el autor puede eliminar un comentario denunciado.
router.post(
    '/comments/:reportId/delete',
    isAuthenticated,
    reportsController.deleteReportedComment
);

//solo los validadores y administradores pueden consultar la lista de trabajo
router.get(
    '/moderation',
    isAuthenticated,
    isValidator,
    reportsController.moderationQueue
);


//resolver una denuncia: desestimar o dar de baja.
router.post(
    '/moderation/:publicationId/images/:imageId/resolve',
    isAuthenticated,
    isValidator,
    reportsController.resolveImageReports
);

// TEMPORAL: ruta para comprobar los permisos del validador.
// Eliminar después de completar las pruebas.

router.get(
    '/_test-validator',
    isAuthenticated,
    isValidator,
    (req, res) => {
        res.status(200).send(
            `Acceso autorizado. Rol: ${req.currentUser.rol}`
        );
    }
);
module.exports = router;
