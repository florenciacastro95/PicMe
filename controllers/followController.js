const { Usuario, Seguidor } = require('../models');

const follow = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.session.user.id;
        const targetUserId = parseInt(userId);
        if (currentUserId === targetUserId) {
            req.session.alert = {
                type: 'warning',
                text: 'No puedes seguirte a ti mismo.'
            };
            return req.session.save(() => res.redirect('back'));
        }

        const targetUser = await Usuario.findOne({
            where: { id: targetUserId, activo: true }
        });

        if (!targetUser) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario no encontrado.'
            };
            return req.session.save(() => res.redirect('back'));
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
            return res.redirect('/profile/' + targetUser.username);
        }

        await Seguidor.create({
            seguidor_id: currentUserId,
            seguido_id: targetUserId
        });

        req.session.alert = {
            type: 'success',
            text: 'Ahora sigues a ' + targetUser.username + '.'
        };

        return req.session.save((err) => {
            if (err) console.error('Error al guardar sesión en follow:', err);
            return res.redirect('/profile/' + targetUser.username);
        });

    } catch (error) {
        console.error('Error al seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al seguir al usuario.'
        };
        return req.session.save(() => res.redirect('back'));
    }
};

const unfollow = async (req, res) => {
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
            return req.session.save(() => res.redirect('/'));
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
                text: 'No seguias a este usuario.'
            };
        }

        return req.session.save((err) => {
            if (err) console.error('Error al guardar sesión en unfollow:', err);
            return res.redirect('/profile/' + targetUser.username);
        });

    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al dejar de seguir al usuario.'
        };
        return req.session.save(() => res.redirect('back'));
    }
};

module.exports = {
    follow,
    unfollow
};
