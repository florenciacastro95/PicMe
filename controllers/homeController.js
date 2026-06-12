const { Publicacion, Usuario, Imagen, Tag, Rating } = require('../models');

exports.index = async (req, res) => {
    try {
        const user = req.session && req.session.user ? req.session.user : null;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = 12;
        const offset = (page - 1) * limit;

        const imageInclude = {
            model: Imagen,
            as: 'imagenes',
            include: [{
                model: Rating,
                as: 'ratings'
            }]
        };

        if (!user) {
            imageInclude.where = { copyright: 'sin_copyright' };
            imageInclude.required = true;
        }

        const { count, rows: publicacionesModel } = await Publicacion.findAndCountAll({
            where: { activo: true },
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'username', 'avatar']
            },
            {
                model: Tag,
                as: 'tags',
                through: { attributes: [] }
            },
                imageInclude
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true

        });
        const totalPages = Math.ceil(count / limit);
        const publicaciones = publicacionesModel.map(pubInstance => {
            const pub = pubInstance.get({ plain: true });

            let sumaPuntuaciones = 0;
            let cantidadValoraciones = 0;

            if (pub.imagenes) {
                pub.imagenes.forEach(img => {
                    if (img.ratings) {
                        img.ratings.forEach(rating => {
                            sumaPuntuaciones += rating.puntuacion;
                            cantidadValoraciones++;
                        });
                    }
                });
            }

            pub.totalImagenes = pub.imagenes ? pub.imagenes.length : 0;
            pub.promedioValoracion =
                cantidadValoraciones > 0
                    ? (sumaPuntuaciones / cantidadValoraciones).toFixed(1)
                    : null;

            pub.cantidadValoraciones = cantidadValoraciones;
            return pub;
        });
        res.render('home/index', {
            title: 'PicME!',
            publicaciones,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });
    }
    catch (err) {
        console.error("Error en la Home:", err);
        req.session.alert = {
            type: 'danger',
            text: 'Error al cargar las publicaciones.'
        };
        res.render('home/index', {
            title: 'PicME! - Comparte, mira, pickea :3',
            publicaciones: [],
            currentPage: 1,
            totalPages: 0
        });
    }

};