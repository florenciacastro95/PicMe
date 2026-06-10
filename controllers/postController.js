const { Publicacion, Usuario, Imagen, Tag, PublicacionTag, Comentario, Rating } = require('../models');
exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    try {
        const { titulo, descripcion, tags, copyright } = req.body;

        const publicacion = await Publicacion.create({
            usuario_id: req.session.user.id,
            titulo,
            descripcion,
        });


        if (req.files && req.files.length > 0) {
            const copyrightValues = Array.isArray(copyright) ? copyright : [copyright];
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                let copyrightValue = copyrightValues[i] || 'sin_copyright';
                if (copyright === 'on') copyrightValue = 'copyright';
                await Imagen.create({ publicacion_id: publicacion.id, url: `/uploads/${file.filename}`, copyright: copyrightValue });
            }
        }
        //-*-*
        if (tags) {
            const tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);

            for (const nombreTag of tags) {

                const [tag] = await Tag.findOrCreate({ where: { nombre: nombreTag } });
                await PublicacionTag.findOrCreate({
                    where: { publicacion_id: publicacion.id, tag_id: tag.id }
                });
            }
        }
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.redirect('/posts/create');
    }
};

exports.show = async (req, res) => {
    try {
        const publicacion = await Publicacion.findByPk(req.params.id, {
            include: [{
                model: Usuario,
                as: 'usuario'
            },
            {
                model: Imagen,
                as: 'imagenes',
                include: [{
                    model: Rating,
                    as: 'ratings'
                }]
            },
            {
                model: Tag,
                as: 'tags'
            },
            {
                model: Comentario,
                as: 'comentarios',
                include: [
                    {
                        model: Usuario,
                        as: 'usuario'
                    }
                ]
            }
            ]
        });

        if (!publicacion) {
            return res.redirect('/');
        }
        const publicacionPlana = publicacion.get({ plain: true });
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId && publicacionPlana.imagenes) {
            publicacionPlana.imagenes = publicacionPlana.imagenes.filter(img => img.copyright === 'sin_copyright');
            if (publicacionPlana.imagenes.length === 0) {
                return res.redirect('/');
            }
        }
        if (publicacionPlana.imagenes) {
            publicacionPlana.imagenes.forEach(imagen => {
                const listaRatings = imagen.ratings || [];
                const total = listaRatings.length;
                const suma = listaRatings.reduce((acc, r) => acc + r.puntuacion, 0);
                imagen.totalVotos = total;
                imagen.promedio = total > 0 ? (suma / total).toFixed(1) : '0.0';
                const miVoto = userId ? listaRatings.find(r => r.usuario_id === userId) : null;
                imagen.miValoracion = miVoto ? miVoto.puntuacion : null;
            });
        }
        res.render('posts/show', {
            publicacion: publicacionPlana
        });

    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
};

exports.showEdit = async (req, res) => {

    const publicacion = await Publicacion.findByPk(req.params.id,
        {
            include: [{
                model: Imagen,
                as: 'imagenes'
            }]
        }
    );

    if (!publicacion) {
        return res.redirect('/');
    }

    if (publicacion.usuario_id !== req.session.user.id) {
        return res.redirect('/');
    }

    res.render('posts/edit', {
        publicacion
    });

};

exports.update = async (req, res) => {

    const publicacion = await Publicacion.findByPk(req.params.id);

    if (!publicacion) {
        return res.redirect('/');
    }

    if (publicacion.usuario_id !== req.session.user.id) {
        return res.redirect('/');
    }
    await publicacion.update({
        titulo: req.body.titulo,
        descripcion: req.body.descripcion
    });

    const { copyright_existente, imagenesEliminar, copyright } = req.body;

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

        await Imagen.destroy({
            where: {
                id: ids,
                publicacion_id: publicacion.id
            }
        });

    }
    if (req.files && req.files.length > 0) {
        const newCopyright = req.body.copyright_nuevo || copyright;
        const copyrightValues = Array.isArray(newCopyright) ? newCopyright : [newCopyright];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            let copyrightValue = copyrightValues[i] || 'sin_copyright';
            if (newCopyright === 'on') copyrightValue = 'copyright';
            await Imagen.create({
                publicacion_id: publicacion.id,
                url: `/uploads/${file.filename}`,
                copyright: copyrightValue
            });

        }

    }
    const urlPublicacion = `/posts/${publicacion.id}`;
    res.redirect(urlPublicacion);

};

exports.changeComments = async (req, res) => {

    const publicacion =
        await Publicacion.findByPk(req.params.id);

    if (publicacion.usuario_id !== req.session.user.id) {
        return res.redirect('/');
    }

    await publicacion.update({

        comentarios_habilitados:
            !publicacion.comentarios_habilitados

    });

    const urlPublicacion = '/posts/' + publicacion.id;
    return res.redirect(urlPublicacion);

};

exports.destroy = async (req, res) => {

    const publicacion = await Publicacion.findByPk(req.params.id);

    if (!publicacion) {
        return res.redirect('/');
    }

    if (publicacion.usuario_id !== req.session.user.id) {
        return res.redirect('/');
    }
    await Imagen.destroy({
        where: {
            publicacion_id: publicacion.id
        }

    });
    await publicacion.destroy();

    res.redirect('/');
};