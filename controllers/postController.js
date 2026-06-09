const { Publicacion, Usuario, Imagen, Tag, PublicacionTag, Comentario } = require('../models');
exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;
        const publicacion = await Publicacion.create({
            usuario_id: req.session.user.id,
            titulo,
            descripcion
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
                as: 'imagenes'
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
                    }]
            }
            ]
        });

        if (!publicacion) {
            return res.redirect('/');
        }

        res.render('posts/show', {
            publicacion
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
    res.redirect(`/posts/${publicacion.id}`);

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

    res.redirect('/posts/' + publicacion.id);

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