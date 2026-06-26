const { Usuario, Seguidor } = require('../models');

//voy a hacer el .save que tienen los redirects en una sola función así no lo repito 20 veces
const saveRedirect = (req, res, path) => {
    req.session.save(() => res.redirect(path));
};

exports.follow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.session.user.id;
        const targetUserId = parseInt(userId);
        if (currentUserId === targetUserId) {
            req.session.alert = {
                type: 'warning',
                text: 'No puedes seguirte a ti mismo.'
            };
            return saveRedirect(req, res, 'back');
        }

        const targetUser = await Usuario.findOne({
            where: { id: targetUserId, activo: true }
        });

        if (!targetUser) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };
            return saveRedirect(req, res, 'back');
        }

        const existingFollow = await Seguidor.findOne({
            where: {
                seguidor_id: currentUserId,
                seguido_id: targetUserId
            }
        });

        if (existingFollow) {
            req.session.alert = {
                type: 'info',
                text: 'Ya sigues a este usuario.'
            };
            return saveRedirect(req, res, '/profile/' + targetUser.username);
        }

        await Seguidor.create({
            seguidor_id: currentUserId,
            seguido_id: targetUserId
        });

        req.session.alert = {
            type: 'success',
            text: 'Ahora sigues a ' + targetUser.username + '.'
        };

        return saveRedirect(req, res, '/profile/' + targetUser.username);

    } catch (error) {
        console.error('Error al seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al seguir al usuario.'
        };
        return saveRedirect(req, res, 'back');
    }
};

exports.unfollow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.session.user.id;
        const targetUserId = parseInt(userId);

        const targetUser = await Usuario.findOne({
            where: { id: targetUserId, activo: true }
        });

        if (!targetUser) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };
            return saveRedirect(req, res, '/');
        }

        const deleted = await Seguidor.destroy({
            where: {
                seguidor_id: currentUserId,
                seguido_id: targetUserId
            }
        });

        if (deleted) {
            req.session.alert = {
                type: 'success',
                text: 'Dejaste de seguir a ' + targetUser.username + '.'
            };
        } else {
            req.session.alert = {
                type: 'info',
                text: 'No seguías a este usuario.'
            };
        }

        return saveRedirect(req, res, '/profile/' + targetUser.username);
    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al dejar de seguir al usuario.'
        };
        return saveRedirect(req, res, 'back');
    }
};