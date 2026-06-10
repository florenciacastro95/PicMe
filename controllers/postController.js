const { Publicacion, Usuario, Imagen, Tag, PublicacionTag, Comentario, Rating } = require('../models');
exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;

        const copyright = req.body.copyright === 'on';
        const publicacion = await Publicacion.create({
            usuario_id: req.session.user.id,
            titulo,
            descripcion,
            copyright
        });
        console.log(req.files);

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await Imagen.create({ publicacion_id: publicacion.id, url: `/uploads/${file.filename}` });
            }
        }
        //-*-*
        if (req.body.tags) {
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
            publicacion:publicacionPlana
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

    const copyright = req.body.copyright === 'on';

    await publicacion.update({
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        copyright: copyright
    });
    const { imagenesEliminar } = req.body;

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

        for (const file of req.files) {

            await Imagen.create({
                publicacion_id: publicacion.id,
                url: `/uploads/${file.filename}`
            });

        }

    }
    const urlPublicacion = `/posts/${publicacion.id}`;
    res.redirect(urlPublicacion);

};

exports.changeComments = async(req,res)=>{

    const publicacion =
        await Publicacion.findByPk(req.params.id);

    if(publicacion.usuario_id !== req.session.user.id){
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