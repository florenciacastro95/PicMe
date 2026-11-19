const { Usuario, Seguidor, Publicacion, Imagen, Tag, Rating } = require('../models');
const { Op } = require('sequelize');
//voy a hacer el .save que tienen los redirects en una sola función así no lo repito 20 veces
const saveRedirect = (req, res, path) => {
    req.session.save(() => res.redirect(path));
};

exports.follow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.session.user.id;
        const targetUserId = parseInt(userId);
        if (currentUserId === targetUserId) {
            req.session.alert = {
                type: 'warning',
                text: 'No puedes seguirte a ti mismo.'
            };
            return saveRedirect(req, res, 'back');
        }

        const targetUser = await Usuario.findOne({
            where: { id: targetUserId, activo: true }
        });

        if (!targetUser) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };
            return saveRedirect(req, res, 'back');
        }

        const existingFollow = await Seguidor.findOne({
            where: {
                seguidor_id: currentUserId,
                seguido_id: targetUserId
            }
        });

        if (existingFollow) {
            req.session.alert = {
                type: 'info',
                text: 'Ya sigues a este usuario.'
            };
            return saveRedirect(req, res, '/profile/' + targetUser.username);
        }

        await Seguidor.create({
            seguidor_id: currentUserId,
            seguido_id: targetUserId
        });

        req.session.alert = {
            type: 'success',
            text: 'Ahora sigues a ' + targetUser.username + '.'
        };

        return saveRedirect(req, res, '/profile/' + targetUser.username);

    } catch (error) {
        console.error('Error al seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al seguir al usuario.'
        };
        return saveRedirect(req, res, 'back');
    }
};

exports.unfollow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.session.user.id;
        const targetUserId = parseInt(userId);

        const targetUser = await Usuario.findOne({
            where: { id: targetUserId, activo: true }
        });

        if (!targetUser) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };
            return saveRedirect(req, res, '/');
        }

        const deleted = await Seguidor.destroy({
            where: {
                seguidor_id: currentUserId,
                seguido_id: targetUserId
            }
        });

        if (deleted) {
            req.session.alert = {
                type: 'success',
                text: 'Dejaste de seguir a ' + targetUser.username + '.'
            };
        } else {
            req.session.alert = {
                type: 'info',
                text: 'No seguías a este usuario.'
            };
        }

        return saveRedirect(req, res, '/profile/' + targetUser.username);
    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al dejar de seguir al usuario.'
        };
        return saveRedirect(req, res, 'back');
    }
};

exports.feed = async (req, res) => {
    try {
        const currentUserId = req.session.user.id;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = 12;
        const offset = (page - 1) * limit;
        const seguidos = await Seguidor.findAll({
            attributes: ['seguido_id'],
            where: {
                seguidor_id: currentUserId
            },
            raw: true
        });

        const idsSeguidos = seguidos.map(seguidor => seguidor.seguido_id);

        if (idsSeguidos.length === 0) {
            return res.render('follow/feed', {
                title: 'Publicaciones que sigo - PicME!',
                publicaciones: [],
                seguidosCount: 0,
                currentPage: 1,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
            });
        }

        const { count, rows: publicacionesModel } =
            await Publicacion.findAndCountAll({

                where: {
                    activo: true,
                    usuario_id: {
                        [Op.in]: idsSeguidos
                    }
                },

                include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'username', 'avatar'],
                        where: {
                            activo: true
                        },
                        required: true
                    },
                    {
                        model: Imagen,
                        as: 'imagenes',
                        required: true,
                        include: [
                            {
                                model: Rating,
                                as: 'ratings',
                                attributes: ['puntuacion']
                            }
                        ]
                    },
                    {
                        model: Tag,
                        as: 'tags',
                        through: {
                            attributes: []
                        }
                    }
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

            const primeraImagen = pub.imagenes && pub.imagenes.length > 0
                ? pub.imagenes[0]
                : null;

            pub.copyright = primeraImagen
                ? primeraImagen.copyright
                : 'sin_copyright';

            return pub;
        });

        return res.render('follow/feed', {
            title: 'Publicaciones que sigo - PicME!',
            publicaciones,
            seguidosCount: idsSeguidos.length,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });

    } catch (error) {

        console.error(
            'Error al cargar publicaciones de usuarios seguidos:',
            error
        );

        req.session.alert = {
            type: 'danger',
            text: 'No se pudieron cargar las publicaciones de las personas que seguís.'
        };

        return saveRedirect(req, res, '/');
    }
};