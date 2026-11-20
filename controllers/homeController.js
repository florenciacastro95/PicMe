const {Publicacion, Usuario, Imagen, Tag, Rating} = require('../models');

exports.index = async (req, res) => {
    const user = req.session && req.session.user
        ? req.session.user
        : null;
    try {
        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );
        const limit = 12;
        const offset = (page - 1) * limit;
        const PROMEDIO_MINIMO = 4;
        const VOTOS_MINIMOS = 3;
        const imageInclude = {
            model: Imagen,
            as: 'imagenes',
            include: [
                {
                    model: Rating,
                    as: 'ratings',
                    attributes: ['id', 'puntuacion', 'usuario_id']
                }
            ]
        };
        if (!user) {
            imageInclude.where = {copyright: 'sin_copyright'};
            imageInclude.required = true;
        }

        const publicacionesModel = await Publicacion.findAll({
            where: {activo: true},
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'username', 'avatar']
                },
                {
                    model: Tag,
                    as: 'tags',
                    through: {
                        attributes: []
                    }
                },
                imageInclude
            ],

            order: [
                ['created_at', 'DESC']
            ]
        });
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

            pub.totalImagenes = pub.imagenes
                ? pub.imagenes.length
                : 0;
            const promedio = cantidadValoraciones > 0
                ? sumaPuntuaciones / cantidadValoraciones
                : 0;
            pub.promedioValoracion = cantidadValoraciones > 0
                ? promedio.toFixed(1)
                : null;

            pub.cantidadValoraciones = cantidadValoraciones;
            pub.esPreferencial =
                promedio >= PROMEDIO_MINIMO &&
                cantidadValoraciones >= VOTOS_MINIMOS;
            return pub;
        });

        const preferenciales = publicaciones
            .filter(pub => pub.esPreferencial)
            .sort((a, b) => {
                const diferenciaPromedio =
                    Number(b.promedioValoracion) -
                    Number(a.promedioValoracion);
                if (diferenciaPromedio !== 0) {
                    return diferenciaPromedio;
                }
                const diferenciaVotos =
                    b.cantidadValoraciones -
                    a.cantidadValoraciones;

                if (diferenciaVotos !== 0) {
                    return diferenciaVotos;
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });

        const alternativas = publicaciones
            .filter(pub => !pub.esPreferencial)
            .sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });

        const publicacionesOrdenadas = [];
        let indicePreferenciales = 0;
        let indiceAlternativas = 0;
        while (indicePreferenciales < preferenciales.length || indiceAlternativas < alternativas.length ) {

            for (let i = 0; i < 2; i++) {
                if (indicePreferenciales < preferenciales.length) {
                    publicacionesOrdenadas.push(preferenciales[indicePreferenciales]);
                    indicePreferenciales++;
                }
            }

            if (indiceAlternativas < alternativas.length) {
                publicacionesOrdenadas.push(alternativas[indiceAlternativas]);
                indiceAlternativas++;
            }
        }
        const total = publicacionesOrdenadas.length;
        const totalPages = Math.ceil(total / limit);
        const publicacionesPagina = publicacionesOrdenadas.slice(
            offset,
            offset + limit
        );

        publicacionesPagina.forEach(pub => {
            delete pub.esPreferencial;
        });

        return res.render('home/index', {

            title: 'PicME!',
            publicaciones: publicacionesPagina,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            user
        });

    } catch (err) {
        console.error('Error en la Home:', err);
        req.session.alert = {
            type: 'danger',
            text: 'Error al cargar las publicaciones.'
        };
        return res.render('home/index', {
            title: 'PicME!',
            publicaciones: [],
            currentPage: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
            user
        });
    }
};