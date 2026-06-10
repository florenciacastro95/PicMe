const { Publicacion, Usuario, Imagen, Tag } = require('../models');

exports.index = async (req, res) => {
    try {
        const user = req.session && req.session.user ? req.session.user : null;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = 12;
        const offset = (page - 1) * limit;

        const imageInclude = {
            model: Imagen,
            as: 'imagenes'
        };

        if (!user) {
            imageInclude.where = { copyright: 'sin_copyright' };
            imageInclude.required = true;
        }

        console.log('USUARIO LOGUEADO?', !!user);
        console.log('IMAGE INCLUDE:', imageInclude);
        const { count, rows: publicaciones } = await Publicacion.findAndCountAll({
            where: { activo: true },
            include: [{
                model: Usuario,
                as: 'usuario'
            },
            {
                model: Tag,
                as: 'tags'
            },
                imageInclude
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true

        });
        console.log('=== HOME DESLOGUEADA ===');

        for (const pub of publicaciones) {
            console.log(
                JSON.stringify(
                    pub.toJSON(),
                    null,
                    2
                )
            );
        }
        //////
        const totalPages = Math.ceil(count / limit);
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
        res.status(500).send("internal serverror")
    }

};