//flor recordá siempre auth=/= autoriz el primero quien sos vos flaco, el segundo va a validar que podes hacer de acuerdo a lo que seas :3
const { Usuario } = require('../models');

const isAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.id) {
        if (req.session) {
            req.session.alert = {
                type: 'warning',
                text: 'Tenés que iniciar sesión para acceder a esta página.'
            };
            return req.session.save(() => {
                res.redirect('/auth/login');
            });
        }
        return res.redirect('/auth/login');
    }
    try {
        const usuario = await Usuario.findByPk(
            req.session.user.id,
            {
                attributes: ['id', 'rol', 'activo']
            }
        );
        if (!usuario || !usuario.activo) {
            return req.session.destroy((error) => {
                if (error) {
                    console.error('Error al destruir sesión:', error);
                }
                res.clearCookie('connect.sid', { path: '/' });
                return res.redirect('/auth/login');
            });
        }

        req.session.user.rol = usuario.rol;
        req.currentUser = usuario;
        return next();

    } catch (error) {

        console.error('Error verificando autenticación:', error);

        return res.status(500).send(
            'No se pudo verificar la autenticación.'
        );
    }
};

const isNotAuthenticated = (req, res, next) => {if (req.session.user) {
        return res.redirect('/');
    }
    next();
};


const requireRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        const usuario = req.currentUser;
        if (!usuario) {
            return res.redirect('/auth/login');
        }
        if (!rolesPermitidos.includes(usuario.rol)) {
            return res.status(403).render('errors/403', {
                title: 'Acceso prohibido - PICME'
            });
        }
        return next();
    };
};
//validador

const isValidator = requireRole('validador', 'admin');
//addmin

const isAdmin = requireRole('admin');

const configVarLocals = (req, res, next) => {

    res.locals.user =
        req.session &&
        req.session.user &&
        req.session.user.id
            ? req.session.user
            : null;

    res.locals.alert =
        req.session && req.session.alert
            ? req.session.alert
            : null;

    if (req.session) {
        delete req.session.alert;
    }

    next();
};
module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    configVarLocals,
    requireRole,
    isValidator,
    isAdmin

};
