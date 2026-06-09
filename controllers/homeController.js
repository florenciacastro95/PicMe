const { Publicacion, Usuario, Imagen, Tag} = require('../models');

exports.index = async (req, res) => {

    const publicaciones = await Publicacion.findAll({
        include: [{
            model: Usuario,
            as: 'usuario'
        },
        {
            model: Tag,
            as: 'tags'
        },
        {
            model: Imagen,
            as: 'imagenes'
        }
        ],
    order: [['created_at', 'DESC']]
});

res.render('home/index', {
    publicaciones
});

};