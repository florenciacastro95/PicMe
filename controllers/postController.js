const { Publicacion, Usuario, Imagen, Tag, PublicacionTag, Comentario, Rating } = require('../models');
const upload = require('../middlewares/upload');
const cloudinary = require('cloudinary').v2;

exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    console.log("--- INTENTANDO CREAR PUBLICACION ---");


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
                return req.session.save(() => {return res.redirect('/posts/create');});
            }
            const { titulo, descripcion, tags, copyright } = req.body;

            const userId = req.session.user.id;

            if (!titulo || titulo.trim() === '') {
                req.session.alert = { type: 'danger', text: 'El título es obligatorio.' };
                return res.redirect('/posts/create');
            }

            if (!req.files || req.files.length === 0) {
                req.session.alert = { type: 'danger', text: 'Tenés que subir al menos una imagen.' };
                return res.redirect('/posts/create');
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
                const tagsN = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);

                for (const nombreTag of tagsN) {

                    let [tag] = await Tag.findOrCreate({ where: { nombre: nombreTag }, defaults: { nombre: nombreTag } });
                    await PublicacionTag.create({
                        publicacion_id: publicacion.id, tag_id: tag.id
                    }
                    );
                }
            }
            req.session.alert = { type: 'success', text: 'Publicación creada!' };
            return res.redirect('/posts/' + publicacion.id);
        } catch (error) {
            console.log('Error al crear publicación:', error);
            return req.session.save(() => {req.session.alert = { type: 'danger', text: 'Error al crear la publicación.' }});
            res.redirect('/posts/create');
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
                        as: 'ratings'
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
            },
            ],
            order: [
                [{ model: Imagen, as: 'imagenes' }, 'orden', 'ASC'],
                [{ model: Imagen, as: 'imagenes' }, { model: Comentario, as: 'comentarios' }, 'id', 'DESC']
            ]
        });

        if (!publicacion) {
            return req.session.save(() => {req.session.alert = { type: 'danger', text: 'Publicación no encontrada.' }});
            return res.redirect('/');
        }
        let imagenesFiltradas = publicacion.imagenes;
        if (!userId) {
            imagenesFiltradas = publicacion.imagenes.filter(img => img.copyright === 'sin_copyright');
            if (imagenesFiltradas.length === 0) {
                return req.session.save(() => {req.session.alert = { type: 'warning', text: 'Contenido protegido. Inicia sesión para verlo.' }});
                return res.redirect('/');
            }
        }
        const imagenesConStats = imagenesFiltradas.map(img => {
            const ratings = img.ratings || [];
            const promedio = ratings.length > 0
                ? (ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length).toFixed(1)
                : '0.0';
            const totalVotos = ratings.length;
            const miVoto = userId ? ratings.find(r => r.usuario_id === userId) : null;

            return {
                ...img.toJSON(),
                promedio,
                totalVotos,
                miValoracion: miVoto ? miVoto.puntuacion : null
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
        const publicacion = await Publicacion.findOne({
            where: { id, usuario_id: userId, activo: true },
            include: [
                { model: Imagen, as: 'imagenes' },
                { model: Tag, as: 'tags', through: { attributes: [] } }
            ]
        });

        if (!publicacion) {
            return res.redirect('/');
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
    console.log("--- INTENTANDO EDITAR PUBLICACION ---");

    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        const { titulo, descripcion, tags, copyright_existente, imagenesEliminar } = req.body;
        const publicacion = await Publicacion.findOne({
            where: { id, usuario_id: userId, activo: true },
            include: [{ model: Imagen, as: 'imagenes' }]
        });

        if (!publicacion) {
            return res.redirect('/');
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
        return req.session.save(() => {req.session.alert = { type: 'danger', text: 'Error al actualizar la publicación.' }});
        return res.redirect('/');
    }

};

exports.changeComments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;

        const publicacion = await Publicacion.findOne({
            where: { id, usuario_id: userId, activo: true }
        });

        if (!publicacion) return res.redirect('/');

        publicacion.comentarios_habilitados = !publicacion.comentarios_habilitados;
        await publicacion.save();

        req.session.alert = {
            type: 'success',
            text: publicacion.comentarios_habilitados ? 'Comentarios habilitados.' : 'Comentarios deshabilitados.'
        };
        return res.redirect('/posts/' + id);
    } catch (error) {
        return res.redirect('/posts/' + req.params.id);
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

        res.redirect('/');
    } catch (error) {
        res.redirect('/');
    }
};