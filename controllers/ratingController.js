const { Rating, Imagen } = require('../models');

exports.rate = async (req, res) => {
    try {
        const imagenId = req.params.imagenId; 
        const usuarioId = req.session.user.id;
        const puntuacion = parseInt(req.body.puntuacion);

        const imagen = await Imagen.findByPk(imagenId);

        if (!imagen) {
            return res.redirect('/');
        }
        const urlPublicacion = '/posts/' + imagen.publicacion_id;

      
        if (isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) {
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
                puntuacion
            });
        } else {
            await Rating.create({
                imagen_id: imagenId, 
                usuario_id: usuarioId,
                puntuacion
            });
        }

       
        return res.redirect(urlPublicacion);

    } catch (error) {
        console.error('Error al valorar:', error);
        
    }
};