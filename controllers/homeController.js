const { Publicacion, Usuario } = require('../models');

exports.index = async (req, res) => {

    const publicaciones = await Publicacion.findAll({
        include: [{
            model: Usuario,
            as: 'usuario'
        }],
        order: [['created_at', 'DESC']]
    });

    res.render('home/index', {
        publicaciones
    });

};