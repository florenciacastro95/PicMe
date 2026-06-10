const { Publicacion, Usuario, Imagen, Tag } = require('../models');

exports.index = async (req, res) => {
    try {
        let where = {};

        if (req.session?.user && !req.user) {
            where.copyright = false;
        }

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
    }
    catch (err) { 
        console.error("Error en la Home:", err);
        res.status(500).send("internal serverror")
    }

};