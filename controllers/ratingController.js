const { Rating, Imagen, Publicacion } = require('../models');

exports.rate = async (req, res) => {
    let urlPublicacion = '/';
    try {
        const { imagenId }= req.params; 
        const usuarioId = req.session.user.id;
        const puntuacion = parseInt(req.body.puntuacion, 10);

        const imagen = await Imagen.findOne({
            where: {id: imagenId},
            include: [
                {
                    model: Publicacion,
                    as: 'publicacion',
                    attributes: ['id', 'usuario_id', 'activo'],
                    where: { activo: true }
                }
            ]
        });


        if (imagen && imagen.publicacion) {
            urlPublicacion = '/posts/' + imagen.publicacion.id;
        }


        if (!imagen|| !imagen.publicacion || !imagen.publicacion.activo) {
            req.session.alert = {
                type: 'danger',
                text: 'Imagen no encontrada.'
            };return res.redirect('/');
        }
        const urlPublicacion = '/posts/' + imagen.publicacion_id;

      
        if (isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
            req.session.alert = {
                type: 'danger',
                text: 'La puntuacion debe estar entre 1 y 5.'
            };
            return res.redirect(urlPublicacion);
        }
        if (imagen.publicacion.usuario_id === userId) {
            req.session.alert = {
                type: 'warning',
                text: 'No puedes valorar tus propias imagenes.'
            };
            return res.redirect(urlPublicacion);
        }
        const existente = await Rating.findOne({
            where: {
                imagen_id: imagenId, 
                usuario_id: usuarioId
            }
        });

        if (existente) {
            await existente.update({
                puntuacion: puntuacion
            });
            req.session.alert = {
                type: 'success',
                text: 'Valoracion actualizada.'
            }
        } else {
            await Rating.create({
                imagen_id: imagenId, 
                usuario_id: usuarioId,
                puntuacion
            });
            req.session.alert = {
                type: 'success',
                text: 'Gracias por tu valoracion.'
            };
        }

    
        return res.redirect(urlPublicacion);

    } catch (error) {
        console.error('Error al valorar:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al registrar la valoracion.'
        };
        return res.redirect(urlPublicacion);
        
    }
};