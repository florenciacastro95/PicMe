const { Publicacion, Usuario, Imagen, Tag, PublicacionTag, Comentario, Rating, Denuncia, sequelize } = require('../models');
const upload = require('../middlewares/upload');
const cloudinary = require('cloudinary').v2;

const saveRedirect = (req, res, path) => {
    req.session.save(() => res.redirect(path));
};

// busca si alguna imagen de la publicación tiene >=1 denuncia pendiente
const tieneDenunciasPendientes = async (publicacionId) => {
    const imagenes = await Imagen.findAll({
        where: {
            publicacion_id: publicacionId
        },
        attributes: ['id']
    });
    const idsImagenes = imagenes.map(imagen => imagen.id);

    if (idsImagenes.length === 0) {
        return false;
    }
    const cantidadDenuncias = await Denuncia.count({
        where: {
            imagen_id: idsImagenes,
            estado: 'pendiente'
        }
    });
    return cantidadDenuncias > 0;
};

exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    upload.array('imagenes', 10)(req, res, async (err) => {
        try {
            if (err) {
                console.error("Error de Multer al subir a Cloudinary:", err);
                let textoAlerta = 'Error al subir las imágenes a la nube.';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    textoAlerta = 'Una o más imágenes superan el tamaño máximo permitido (Máx: 3MB).';
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    textoAlerta = 'No podés subir más de 10 imágenes.';
                }
                req.session.alert = { type: 'danger', text: textoAlerta };
                return saveRedirect(req, res, '/posts/create');
            }
            const { titulo, descripcion, tags, copyright } = req.body;

            const userId = req.session.user.id;

            if (!titulo || titulo.trim() === '') {
                req.session.alert = { type: 'danger', text: 'El título es obligatorio.' };
                return saveRedirect(req, res, '/posts/create');
            }

            if (!req.files || req.files.length === 0) {
                req.session.alert = { type: 'danger', text: 'Tenés que subir al menos una imagen.' };
                return saveRedirect(req, res, '/posts/create');
            }

            const publicacion = await Publicacion.create({
                usuario_id: userId,
                titulo: titulo.trim(),
                descripcion: descripcion ? descripcion.trim() : null,
                comentarios_habilitados: true
            });
            let valorCopyright = 'sin_copyright';
            if (copyright === 'on' || copyright === true || copyright === 'copyright') {
                valorCopyright = 'copyright';
            }

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                await Imagen.create({
                    publicacion_id: publicacion.id, url: file.path, copyright: valorCopyright, orden: i
                });
            }

            //-*-*
            if (tags && tags.trim() !== '') {
                const tagsN = tags.split(',').map(t => t.trim()).filter(Boolean);

                for (const nombreTag of tagsN) {

                    let [tag] = await Tag.findOrCreate({ where: { nombre: nombreTag }, defaults: { nombre: nombreTag } });
                    await PublicacionTag.create({
                        publicacion_id: publicacion.id, tag_id: tag.id
                    }
                    );
                }
            }
            req.session.alert = { type: 'success', text: 'Publicación creada!' };
            return saveRedirect(req, res, '/posts/' + publicacion.id);
        } catch (error) {
            console.log('Error al crear publicación:', error);
            return saveRedirect(req, res, '/posts/create');
        }
    });
}

exports.show = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user ? req.session.user.id : null;
        const publicacion = await Publicacion.findOne({
            where: { id, activo: true },
            include: [{
                model: Imagen,
                as: 'imagenes',
                attributes: {
                    include: [
                        [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('imagenes.ratings.puntuacion')), 0), 'promedioRating'],
                        [sequelize.fn('COUNT', sequelize.col('imagenes.ratings.id')), 'totalVotos']
                    ]
                },
                include: [
                    {
                        model: Comentario,
                        as: 'comentarios',
                        include: [
                            {
                                model: Usuario,
                                as: 'usuario',
                                attributes: ['id', 'username', 'avatar']
                            }]
                    }, {
                        model: Rating,
                        as: 'ratings',
                        attributes: []
                    }]
            },
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'username', 'avatar', 'nombre']
            },
            {
                model: Tag,
                as: 'tags',
                through: { attributes: [] }
            }],
            group: [
                'Publicacion.id',
                'imagenes.id',
                'imagenes->comentarios.id',
                'imagenes->comentarios->usuario.id',
                'usuario.id',
                'tags.id'
            ],
            order: [
                [{ model: Imagen, as: 'imagenes' }, 'orden', 'ASC'],
                [{ model: Imagen, as: 'imagenes' }, { model: Comentario, as: 'comentarios' }, 'id', 'DESC']
            ]
        });

        if (!publicacion || !publicacion.activo) {
            req.session.alert = { type: 'danger', text: 'Publicación no encontrada.' };
            return saveRedirect(req, res, '/');
        }
        let imagenesFiltradas = publicacion.imagenes;
        if (!userId) {
            imagenesFiltradas = publicacion.imagenes.filter(img => img.copyright === 'sin_copyright');
            if (imagenesFiltradas.length === 0) {
                req.session.alert = { type: 'warning', text: 'Contenido protegido. Inicia sesión para verlo.' };
                return saveRedirect(req, res, '/');
            }
        }
        let misVotos = [];
        if (userId && imagenesFiltradas.length > 0) {
            misVotos = await Rating.findAll({
                where: {
                    usuario_id: userId,
                    imagen_id: imagenesFiltradas.map(img => img.id)
                }
            });
        }
        const imagenesConStats = imagenesFiltradas.map(img => {
            const votoUsuario = misVotos.find(v => v.imagen_id === img.id);
            return {
                ...img.toJSON(),
                promedio: parseFloat(img.get('promedioRating')).toFixed(1),
                totalVotos: parseInt(img.get('totalVotos')),
                miValoracion: votoUsuario ? votoUsuario.puntuacion : null
            };
        });

        const isOwner = userId && publicacion.usuario_id === userId;
        res.render('posts/show', {
            publicacion: {
                ...publicacion.toJSON(),
                imagenes: imagenesConStats
            },
            isOwner
        });

    } catch (error) {
        console.log('Error al ver publicación:', error);
        res.redirect('/');
    }
};

exports.showEdit = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        const publicacion = await Publicacion.findByPk(id, {
            include: [
                { model: Imagen, as: 'imagenes' },
                { model: Tag, as: 'tags', through: { attributes: [] } }
            ]
        });

        if (!publicacion || !publicacion.activo || publicacion.usuario_id !== userId) {
            return res.redirect('/');
        }
        const bloqueada = await tieneDenunciasPendientes(publicacion.id);
        if (bloqueada) {
            req.session.alert = {
                type: 'warning',
                text: 'No podés modificar esta publicación porque tiene denuncias pendientes de revisión.'
            };
            return saveRedirect(req, res, '/posts/' + id);
        }
        const tagsString = publicacion.tags.map(t => t.nombre).join(', ');
        res.render('posts/edit', {
            publicacion, tagsString
        });
    } catch (err) {
        console.error("Error al mostrar vista de edición:", err);
        return res.redirect('/');
    }

};

exports.update = async (req, res) => {
    upload.array('imagenes', 10)(req, res, async (err) => {
        try {

            if (err) {
                console.error("Error de Multer al editar:", err);
                let textoAlerta = 'Error al subir las nuevas imágenes.';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    textoAlerta = 'Una o más imágenes superan los 3MB.';
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    textoAlerta = 'No podés subir más de 10 imágenes.';
                }
                req.session.alert = { type: 'danger', text: textoAlerta };
                return saveRedirect(req, res, `/posts/${req.params.id}/edit`);
            }

            const { id } = req.params;
            const userId = req.session.user.id;
            const { titulo, descripcion, tags, copyright_existente, imagenesEliminar } = req.body;
            const publicacion = await Publicacion.findByPk(id, {
                include: [{ model: Imagen, as: 'imagenes' }]
            });

            if (!publicacion || !publicacion.activo || publicacion.usuario_id !== userId) {
                return res.redirect('/');
            }

            const bloqueada = await tieneDenunciasPendientes(publicacion.id);
            if (bloqueada) {
                req.session.alert = {
                    type: 'warning',
                    text: 'La publicación no puede modificarse porque tiene denuncias pendientes.'
                };
                return saveRedirect(req, res, '/posts/' + id);
            }

            await publicacion.update({
                titulo: req.body.titulo,
                descripcion: descripcion ? descripcion.trim() : null
            });


            if (copyright_existente) {
                const copyrightObj = typeof copyright_existente === 'object' ? copyright_existente : {};
                for (const [imgId, value] of Object.entries(copyrightObj)) {
                    await Imagen.update(
                        { copyright: value },
                        { where: { id: imgId, publicacion_id: publicacion.id } }
                    );
                }
            }
            if (imagenesEliminar) {

                const ids = Array.isArray(imagenesEliminar)
                    ? imagenesEliminar
                    : [imagenesEliminar];

                const imagenesABorrar = await Imagen.findAll({ where: { id: ids, publicacion_id: publicacion.id } });


                for (const img of imagenesABorrar) {
                    try {
                        const partesUrl = img.url.split('/')
                        const folderYArchivo = partesUrl.slice(-2).join('/');
                        const publicId = folderYArchivo.split('.')[0];

                        await cloudinary.uploader.destroy(publicId);
                        console.log(`Eliminado físico en Cloudinary exitoso: ${publicId}`);
                    } catch (cloudErr) {
                        console.error("Error al borrar archivo físico de Cloudinary:", cloudErr);
                    }
                }
                await Imagen.destroy({
                    where: { id: ids, publicacion_id: publicacion.id }
                });

            }
            if (req.files && req.files.length > 0) {
                const newCopyright = req.body.copyright_nuevo || req.body.copyright;
                const copyrightValues = Array.isArray(newCopyright) ? newCopyright : [newCopyright];
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    let copyrightValue = copyrightValues[i] || 'sin_copyright';
                    if (newCopyright === 'on') copyrightValue = 'copyright';

                    await Imagen.create({
                        publicacion_id: publicacion.id,
                        url: file.path,
                        copyright: copyrightValue
                    });
                }
            }

            if (tags !== undefined) {
                await PublicacionTag.destroy({ where: { publicacion_id: publicacion.id } });
                if (tags.trim() !== '') {
                    const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean);
                    for (const nombreTag of tagNames) {
                        let [tag] = await Tag.findOrCreate({ where: { nombre: nombreTag } });
                        await PublicacionTag.create({ publicacion_id: publicacion.id, tag_id: tag.id });
                    }
                }
            }

            const urlPublicacion = `/posts/${publicacion.id}`;
            res.redirect(urlPublicacion);

        } catch (err) {
            console.error("Error en update controlador:", err);
            req.session.alert = { type: 'danger', text: 'Error al actualizar la publicación.' };
            return saveRedirect(req, res, '/');
        }
    });
};

exports.changeComments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;

        const publicacion = await Publicacion.findByPk(id);

        if (!publicacion || !publicacion.activo || publicacion.usuario_id !== userId) {
            return res.status(403).send(
                'No tenés permiso para modificar los comentarios de esta publicación.'
            );
        }
        publicacion.comentarios_habilitados = !publicacion.comentarios_habilitados;
        await publicacion.save();

        req.session.alert = {
            type: 'success',
            text: publicacion.comentarios_habilitados ? 'Comentarios habilitados.' : 'Comentarios deshabilitados.'
        };
        return saveRedirect(req, res, '/posts/' + id);
    } catch (error) {
        return saveRedirect(req, res, '/posts/' + req.params.id);
    }
};

exports.destroy = async (req, res) => {
    try {
        const publicacion = await Publicacion.findByPk(req.params.id);

        if (!publicacion) {
            return res.redirect('/');
        }

        if (publicacion.usuario_id !== req.session.user.id) {
            return res.redirect('/');
        }
        publicacion.activo = false;
        await publicacion.save();

        req.session.alert = { type: 'success', text: 'Publicación eliminada.' };

        return saveRedirect(req, res, '/');
    } catch (error) {
        res.redirect('/');
    }
};