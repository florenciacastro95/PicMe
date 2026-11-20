const { Rating, Imagen, Publicacion } = require('../models');

const saveRedirect = (req, res, path) => {
    req.session.save(() => res.redirect(path));
};

exports.rate = async (req, res) => {

    let urlPublicacion = '/';

    try {

        const { imagenId } = req.params;
        const usuarioId = req.session.user.id;
        const puntuacion = Number(req.body.puntuacion);
        const imagen = await Imagen.findOne({
            where: {
                id: imagenId
            },
            include: [
                {
                    model: Publicacion,
                    as: 'publicacion',
                    attributes: ['id', 'usuario_id', 'activo'],
                    where: {
                        activo: true
                    }
                }
            ]
        });
        if (!imagen || !imagen.publicacion || !imagen.publicacion.activo) {

            req.session.alert = {
                type: 'danger',
                text: 'Imagen no encontrada.'
            };
            return saveRedirect(req, res, '/');
        }

        urlPublicacion = '/posts/' + imagen.publicacion.id;
        if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {

            req.session.alert = {
                type: 'danger',
                text: 'La puntuación debe estar entre 1 y 5.'
            };
            return saveRedirect(req, res, urlPublicacion);
        }
        if (imagen.publicacion.usuario_id === usuarioId) {

            req.session.alert = {
                type: 'warning',
                text: 'No podés valorar tus propias imágenes.'
            };
            return saveRedirect(req, res, urlPublicacion);
        }
        const existente = await Rating.findOne({
            where: {
                imagen_id: imagenId,
                usuario_id: usuarioId
            }
        });

        if (existente) {

            req.session.alert = {
                type: 'warning',
                text: 'Ya valoraste esta imagen. Cada usuario puede valorarla una sola vez.'
            };

            return saveRedirect(req, res, urlPublicacion);
        }
        await Rating.create({
            imagen_id: imagenId,
            usuario_id: usuarioId,
            puntuacion
        });

        req.session.alert = {
            type: 'success',
            text: '¡Gracias por tu valoración!'
        };

        return saveRedirect(req, res, urlPublicacion);

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {

            req.session.alert = {
                type: 'warning',
                text: 'Ya valoraste esta imagen anteriormente.'
            };
            return saveRedirect(req, res, urlPublicacion);
        }

        console.error('Error al valorar:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al registrar la valoración.'
        };
        return saveRedirect(req, res, urlPublicacion);
    }
};