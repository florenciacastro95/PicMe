const { Publicacion, Usuario, Imagen } = require('../models');
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
            }]
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