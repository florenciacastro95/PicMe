const { Publicacion, Usuario } = require('../models');

exports.showCreate = (req, res) => {
    res.render('posts/create');
};

exports.create = async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;

        await Publicacion.create({
            usuario_id: req.session.user.id,
            titulo,
            descripcion
        });

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

    const publicacion = await Publicacion.findByPk(req.params.id);

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

    await publicacion.destroy();

    res.redirect('/');
};