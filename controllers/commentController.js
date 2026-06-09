const { Comentario } = require('../models');

const commentController = {
    create: async (req, res) => {
        try {
            if (!req.body.contenido || req.body.contenido.trim() === '') {
                return res.redirect('back');
            }
            await Comentario.create({
                publicacion_id: req.params.id,
                usuario_id: req.session.user.id,
                contenido: req.body.contenido
            });
            return res.redirect('back');
            
        } catch (error) {
            console.error('Error al crear el comentario:', error);
            return res.status(500).render('errors/500');
        }
    },


    destroy: async (req, res) => {
        try {
            const comentario = await Comentario.findByPk(req.params.id);
            if (!comentario) {
                return res.status(404).render('errors/404');
            }
            if (comentario.usuario_id !== req.session.user.id) {
                return res.redirect('/');
            }
            await comentario.destroy();
            return res.redirect('back');
        } catch (error) {
            console.error('Error al eliminar el comentario:', error);
            return res.status(500).render('errors/500');
        }
    }
};

module.exports = commentController;