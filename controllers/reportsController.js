
const { Op } = require('sequelize');

const {sequelize,Denuncia,Imagen,Publicacion,Comentario,Usuario} = require('../models');

const MOTIVOS = {
    spam: 'Spam',
    contenido_inapropiado: 'Contenido inapropiado para PicME! (Desnudez, multimedia ilegal, venta de artículos)',
    derechos_autor: 'Violación de derechos de autor',
    acoso: 'Acoso o contenido ofensivo',
    otro: 'Otro motivo'
};
const redirectWithAlert = (req, res, path, type, text) => {
    req.session.alert = { type, text };
    return req.session.save(() => {
        res.redirect(path);
    });
};
const validateReportBody = (body) => {
    const motivo = typeof body.motivo === 'string'
        ? body.motivo.trim()
        : '';
    const descripcion = typeof body.descripcion === 'string'
        ? body.descripcion.trim()
        : '';
    if (!Object.prototype.hasOwnProperty.call(MOTIVOS, motivo)) {
        return {error: 'Seleccioná un motivo de denuncia válido.'};
    }

    if (descripcion.length < 10 || descripcion.length > 1000) {
        return {error: 'La descripción debe tener entre 10 y 1000 caracteres.'};
    }
    return { motivo, descripcion };
};

exports.createImageReport = async (req, res) => {

    const userId = req.session.user.id;
    let redirectPath = '/';

    try {
        const imagen = await Imagen.findByPk(req.params.imageId, {
            include: [
                {model: Publicacion,
                    as: 'publicacion'}
            ]
        });

        if (!imagen ||!imagen.publicacion ||!imagen.publicacion.activo) {
            return res.status(404).render('errors/404');
        }

        redirectPath = `/posts/${imagen.publicacion.id}`;

        //acordate que vos nopodés denunciar tu propio contenido
        if (imagen.publicacion.usuario_id === userId) {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'warning',
                'No podés denunciar una imagen de tu propia publicación.'
            );
        }
        const validacion = validateReportBody(req.body);
        if (validacion.error) {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'danger',
                validacion.error
            );
        }
        await Denuncia.create({
            imagen_id: imagen.id,
            denunciante_id: userId,
            motivo: validacion.motivo,
            descripcion: validacion.descripcion
        });
        const totalDenunciantes = await Denuncia.count({
            where: {
                imagen_id: imagen.id,
                estado: 'pendiente'
            },
            distinct: true,
            col: 'denunciante_id'
        });

        const mensaje = totalDenunciantes >= 4
            ? 'Denuncia registrada. La imagen alcanzó el umbral y quedó en la lista de trabajo del va.'
            : 'Denuncia registrada. La publicación quedó bloqueada para modificaciones mientras se revisa.';

        return redirectWithAlert(
            req,
            res,
            redirectPath,
            'success',
            mensaje
        );

    } catch (error) {

        //no podes volver a denunciar una imagne
        if (error.name === 'SequelizeUniqueConstraintError') {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'info',
                'No podés volver denunciar esta imagen.'
            );
        }

        console.error('Error al denunciar imagen:', error);

        return redirectWithAlert(
            req,
            res,
            redirectPath,
            'danger',
            'No se pudo registrar la denuncia. Intentá nuevamente.'
        );
    }
};

exports.createCommentReport = async (req, res) => {

    const userId = req.session.user.id;
    let redirectPath = '/';

    try {

        const comentario = await Comentario.findByPk(
            req.params.commentId,
            {
                include: [
                    {
                        model: Imagen,
                        as: 'imagen',
                        include: [
                            {
                                model: Publicacion,
                                as: 'publicacion'
                            }
                        ]
                    }
                ]
            }
        );

        if (!comentario ||!comentario.activo ||!comentario.imagen ||!comentario.imagen.publicacion) {
            return res.status(404).render('errors/404');
        }

        const publicacion = comentario.imagen.publicacion;

        redirectPath = `/posts/${publicacion.id}`;

        //no podes denunciar tu proprio commentario
        if (comentario.usuario_id === userId) {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'warning',
                'No podés denunciar tu propio comentario.'
            );
        }

        //los comentarios del autor tampoco se pueden denunciar
        if (comentario.usuario_id === publicacion.usuario_id) {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'warning',
                'Los comentarios del autor de la publicación no se pueden denunciar.'
            );
        }

        const validacion = validateReportBody(req.body);
        if (validacion.error) {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'danger',
                validacion.error
            );
        }

        //registramos la denuncia asociada al comentario.
        await Denuncia.create({
            comentario_id: comentario.id,
            denunciante_id: userId,
            motivo: validacion.motivo,
            descripcion: validacion.descripcion
        });

        return redirectWithAlert(
            req,
            res,
            redirectPath,
            'success',
            'Denuncia del comentario enviada al autor de la publicación.'
        );

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return redirectWithAlert(
                req,
                res,
                redirectPath,
                'info',
                'Ya denunciaste este comentario.'
            );
        }

        console.error('Error al denunciar comentario:', error);

        return redirectWithAlert(
            req,
            res,
            redirectPath,
            'danger',
            'No se pudo registrar la denuncia. Intentá nuevamente.'
        );
    }
};
// 3. Validad
exports.moderationQueue = async (req, res) => {
    try {
        const denuncias = await Denuncia.findAll({where: {
                estado: 'pendiente',
                imagen_id: { [Op.ne]: null }
            },

            include: [
                {model: Usuario, as: 'denunciante',
                    attributes: ['id', 'username']
                },
                {model: Imagen,
                    as: 'imagen',
                    include: [
                        {model: Publicacion,
                            as: 'publicacion',
                            include: [
                                {model: Usuario,
                                    as: 'usuario',
                                    attributes: ['id', 'username']
                                }
                            ]
                        }
                    ]
                }
            ],

            order: [['created_at', 'ASC']]
        });

        //agrupamos las denuncias por imagen.
        const porImagen = new Map();

        for (const denuncia of denuncias) {

            if (!denuncia.imagen ||!denuncia.imagen.publicacion ||!denuncia.imagen.publicacion.activo) {
                continue;
            }

            const imageId = denuncia.imagen.id;
            if (!porImagen.has(imageId)) {
                porImagen.set(imageId, {
                    imagen: denuncia.imagen,
                    publicacion: denuncia.imagen.publicacion,
                    denuncias: [],
                    denunciantes: new Set()
                });
            }

            const caso = porImagen.get(imageId);
            caso.denuncias.push(denuncia);
            caso.denunciantes.add(denuncia.denunciante_id);
        }

        //min 4 de denunciantes para bajarla
        const casos = [...porImagen.values()]

            .filter(caso => caso.denunciantes.size >= 4)
            .map(caso => ({
                imagen: caso.imagen,
                publicacion: caso.publicacion,
                denuncias: caso.denuncias,
                cantidadDenunciantes: caso.denunciantes.size
            }));

        return res.render('reports/moderation', {
            title: 'Moderación de contenido - PicME!',
            casos,
            motivos: MOTIVOS
        });

    } catch (error) {
        console.error('Error al cargar la cola de moderación:', error);
        return res.status(500).render('errors/500');
    }
};


//4. Resolver denuncias con imagenes
exports.resolveImageReports = async (req, res) => {

    const { publicationId, imageId } = req.params;
    const accion = req.body.accion;
    if (!['desestimar', 'baja'].includes(accion)) {
        return redirectWithAlert(
            req,
            res,
            '/reports/moderation',
            'danger',
            'La acción de moderación no es válida.'
        );
    }

    try {
        await sequelize.transaction(async (transaction) => {
            const imagen = await Imagen.findOne({
                where: {
                    id: imageId,
                    publicacion_id: publicationId
                },
                transaction
            });

            const publicacion = await Publicacion.findByPk(
                publicationId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                }
            );

            if (!imagen || !publicacion || !publicacion.activo) {
                throw new Error('PUBLICACION_NO_DISPONIBLE');
            }
            const cantidad = await Denuncia.count({
                where: {
                    imagen_id: imagen.id,
                    estado: 'pendiente'
                },
                distinct: true,
                col: 'denunciante_id',
                transaction
            });

            if (cantidad < 4) {
                throw new Error('UMBRAL_NO_ALCANZADO');
            }

            const ahora = new Date();

            if (accion === 'desestimar') {
                await Denuncia.update(
                    {
                        estado: 'desestimada',
                        resolucion: 'denuncias_desestimadas',
                        resuelto_por: req.session.user.id,
                        resuelto_at: ahora
                    },
                    {
                        where: {
                            imagen_id: imagen.id,
                            estado: 'pendiente'
                        },
                        transaction
                    }
                );

            } else {

                //chau publi
                await publicacion.update(
                    {activo: false},
                    { transaction }
                );

                const imagenesDeLaPublicacion = await Imagen.findAll({
                    where: {
                        publicacion_id: publicacion.id
                    },
                    attributes: ['id'],
                    transaction
                });

                const idsImagenesPublicacion =
                    imagenesDeLaPublicacion.map(row => row.id);

                await Denuncia.update(
                    {
                        estado: 'baja',
                        resolucion: 'publicacion_dada_de_baja',
                        resuelto_por: req.session.user.id,
                        resuelto_at: ahora
                    },
                    {
                        where: {
                            imagen_id: {
                                [Op.in]: idsImagenesPublicacion
                            },
                            estado: 'pendiente'
                        },
                        transaction
                    }
                );

                const autor = await Usuario.findByPk(
                    publicacion.usuario_id,
                    {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    }
                );

                if (autor) {
                    const nuevasBajas = autor.publicaciones_bajadas + 1;
                    await autor.update(
                        {publicaciones_bajadas: nuevasBajas,
                            activo: nuevasBajas >= 3
                                ? false
                                : autor.activo},
                        { transaction }
                    );
                }
            }
        });

        const mensaje = accion === 'baja'
            ? 'La publicación fue dada de baja. Si el autor alcanzó tres bajas, su cuenta quedó inactiva.'
            : 'Las denuncias de esta imagen fueron desestimadas. La publicación se podrá editar cuando no queden otras denuncias pendientes.';

        return redirectWithAlert(
            req,
            res,
            '/reports/moderation',
            'success',
            mensaje
        );

    } catch (error) {

        if (error.message === 'UMBRAL_NO_ALCANZADO') {
            return redirectWithAlert(
                req,
                res,
                '/reports/moderation',
                'warning',
                'El caso ya no alcanza el mínimo de cuatro denunciantes distintos.'
            );
        }

        if (error.message === 'PUBLICACION_NO_DISPONIBLE') {
            return redirectWithAlert(
                req,
                res,
                '/reports/moderation',
                'warning',
                'La publicación ya no está disponible.'
            );
        }

        console.error('Error al resolver denuncias:', error);

        return redirectWithAlert(
            req,
            res,
            '/reports/moderation',
            'danger',
            'No se pudo resolver el caso.'
        );
    }
};

exports.commentReports = async (req, res) => {
    try {const denuncias = await Denuncia.findAll({
            where: {
                estado: 'pendiente',
                comentario_id: { [Op.ne]: null }
            },
            include: [
                {model: Usuario,
                 as: 'denunciante',
                 attributes: ['id', 'username']
                },
                {model: Comentario,
                    as: 'comentario',
                    include: [
                        {model: Usuario,
                            as: 'usuario',
                            attributes: ['id', 'username']},
                        {model: Imagen,
                            as: 'imagen',
                            include: [
                                {model: Publicacion,
                               as: 'publicacion'}
                            ]
                        }
                    ]
                }
            ],

            order: [['created_at', 'DESC']]
        });

        // Mostramos solamente denuncias correspondientes
        // a publicaciones del usuario autenticado.
        const porComentario = new Map();
        for (const denuncia of denuncias) {
            const comentario = denuncia.comentario;
            const publicacion = comentario &&
                comentario.imagen &&
                comentario.imagen.publicacion;
            if (!comentario ||!comentario.activo ||!publicacion ||publicacion.usuario_id !== req.session.user.id) {
                continue;
            }

            if (!porComentario.has(comentario.id)) {
                porComentario.set(comentario.id, {
                    comentario,
                    imagen: comentario.imagen,
                    publicacion,
                    denuncias: []
                });
            }

            porComentario.get(comentario.id).denuncias.push(denuncia);
        }

        return res.render('reports/comments', {
            title: 'Denuncias de comentarios - PicME!',
            casos: [...porComentario.values()],
            motivos: MOTIVOS
        });

    } catch (error) {

        console.error('Error al cargar denuncias de comentarios:', error);

        return res.status(500).render('errors/500');
    }
};

exports.deleteReportedComment = async (req, res) => {

    try {
        const denuncia = await Denuncia.findByPk(
            req.params.reportId,
            {
                include: [
                    {model: Comentario,
                        as: 'comentario',
                        include: [
                            {model: Imagen,
                                as: 'imagen',
                                include: [
                                    {model: Publicacion,
                                        as: 'publicacion'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );

        const comentario = denuncia && denuncia.comentario;

        const publicacion = comentario &&
            comentario.imagen &&
            comentario.imagen.publicacion;

        //solo un autor puede sacar los comentarios denunciados de su publi
        if (
            !denuncia ||
            denuncia.estado !== 'pendiente' ||
            !comentario ||
            !comentario.activo ||
            !publicacion ||
            publicacion.usuario_id !== req.session.user.id
        ) {
            return res.status(403).render('errors/403');
        }

        await sequelize.transaction(async (transaction) => {
            await comentario.update(
                {
                    activo: false
                },
                { transaction }
            );

            //denuncias pendientes como resukltas
            await Denuncia.update(
                {
                    estado: 'resuelta',
                    resolucion: 'comentario_eliminado_por_autor',
                    resuelto_por: req.session.user.id,
                    resuelto_at: new Date()
                },
                {
                    where: {
                        comentario_id: comentario.id,
                        estado: 'pendiente'
                    },
                    transaction
                }
            );
        });

        return redirectWithAlert(
            req,
            res,
            '/reports/comments',
            'success',
            'El comentario fue quitado de la publicación y sus denuncias quedaron resueltas.'
        );
    } catch (error) {
        console.error('Error al eliminar comentario denunciado:', error);
        return redirectWithAlert(
            req,
            res,
            '/reports/comments',
            'danger',
            'No se pudo eliminar el comentario.'
        );
    }
};
