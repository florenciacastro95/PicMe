const {Usuario, Publicacion,Imagen} = require('../models');

exports.show = async (req, res) => {
    const usuario =
        await Usuario.findOne({
            where: {
                username: req.params.username
            }
        });
    if (!usuario) {
        return res.redirect('/');
    }
    const publicaciones =
        await Publicacion.findAll({
            where: {
                usuario_id: usuario.id
            },
            include: [{
                model: Imagen,
                as: 'imagenes'
            }],
            order: [['created_at', 'DESC']]
        });
    res.render('profile/show', {
        perfil: usuario,
        publicaciones
    });

};