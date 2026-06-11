const { Usuario, Publicacion, Imagen, Seguidor, Tag } = require('../models');

const show = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.session.user ? req.session.user.id : null;

        const usuario =
            await Usuario.findOne({
                where: {
                    username,
                    activo: true
                },
                attributes: ['id', 'username', 'nombre', 'bio', 'avatar', 'created_at']
            });
        if (!usuario) {
            req.session.alert = { type: 'danger', text: 'Usuario no encontrado.' };
            return res.redirect('/');
        }
        let imageCondition = {};
        if (!currentUserId) {
            imageCondition.copyright = 'sin_copyright';
        }
        const publicaciones =
            await Publicacion.findAll({
                where: { usuario_id: usuario.id, activo: true },
                include: [
                    {
                        model: Imagen, as: 'imagenes',
                        where: Object.keys(imageCondition).length > 0 ? imageCondition : undefined,
                        required: Object.keys(imageCondition).length > 0
                    },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ],
                order: [['created_at', 'DESC']]
            });
        const seguidoresCount = await Seguidor.count({ where: { seguido_id: usuario.id } });
        const seguidosCount = await Seguidor.count({ where: { seguidor_id: usuario.id } });

        let isFollowing = false;
        if (currentUserId && currentUserId !== usuario.id) {
            const follow = await Seguidor.findOne({
                where: {
                    seguidor_id: currentUserId,
                    seguido_id: usuario.id
                }
            });
            isFollowing = !!follow;
        }
        const isOwnProfile = currentUserId === usuario.id;

        res.render('profile/show', {
            title: `${usuario.username} - PicME!`,
            perfil: usuario,
            publicaciones,
            seguidoresCount,
            seguidosCount,
            isFollowing,
            isOwnProfile
        });
    } catch (error) {
        console.error('Error al ver perfil:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al cargar el perfil.'
        };
        return res.redirect('/');
    }

};

const followers = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.session.user ? req.session.user.id : null;

        const usuario = await Usuario.findOne({ where: { username, activo: true } });
        if (!usuario) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };return res.redirect('/');}

        const seguidores = await Seguidor.findAll({
            where: { seguido_id: usuario.id },
            include: [{ model: Usuario, as: 'seguidor', attributes: ['id', 'username', 'nombre', 'avatar'] }]
        });

        const seguidoresConEstado = await Promise.all(
            seguidores.map(async (item) => {
                const seguidor = item.seguidor.toJSON();
                let isFollowing = false;
                if (currentUserId && currentUserId !== seguidor.id) {
                    const follow = await Seguidor.findOne({
                        where: { seguidor_id: currentUserId, seguido_id: seguidor.id }
                    });
                    isFollowing = !!follow;
                }
                return { ...seguidor, isFollowing, isOwnProfile: currentUserId === seguidor.id };
            })
        );

        return res.render('profile/followers', {
            title: `Seguidores de ${usuario.username} - PicME!`,
            perfil: usuario,
            seguidores: seguidoresConEstado,
            tipo:seguidores
        });
    } catch (error) {
        console.error('Error al ver seguidores:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al cargar seguidores.'
        };
        return res.redirect('/');
    }
};


const following = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.session.user ? req.session.user.id : null;

        const usuario = await Usuario.findOne({ where: { username, activo: true } });
        if (!usuario) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };return res.redirect('/');}

        const seguidos = await Seguidor.findAll({
            where: { seguidor_id: usuario.id },
            include: [{ model: Usuario, as: 'seguido', attributes: ['id', 'username', 'nombre', 'avatar'] }]
        });

        const seguidosConEstado = await Promise.all(
            seguidos.map(async (item) => {
                const seguido = item.seguido.toJSON();
                let isFollowing = false;
                if (currentUserId && currentUserId !== seguido.id) {
                    const follow = await Seguidor.findOne({
                        where: { seguidor_id: currentUserId, seguido_id: seguido.id }
                    });
                    isFollowing = !!follow;
                }
                return { ...seguido, isFollowing, isOwnProfile: currentUserId === seguido.id };
            })
        );

        return res.render('profile/folowing', {
            title: `Seguidos por ${usuario.username} - PicME!`,
            perfil: usuario,
            seguidos: seguidosConEstado,
            tipo: 'seguidos'
        });
    } catch (error) {
        console.error('Error al ver seguidos:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al cargar seguidos.'
        };
        return res.redirect('/');
    }
};

module.exports = {
    show,
    followers,
    following
};