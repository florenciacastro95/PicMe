const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

//voy a hacer el .save que tienen los redirects en una sola función así no lo repito 20 veces
const saveRedirect = (req, res, path) => {
    req.session.save(() => res.redirect(path));
};

const renderLoginError = (res, type, text, status = 401, username = '') => {

    return res.status(status).render('auth/login', {
        title: 'Iniciar sesión - PicME!',
        alert: {
            type,
            text
        },
        username
    });
};
exports.showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Iniciar sesión - PicME!'
    });
};

exports.showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Registrarse - PicME!'
    });
};


exports.login = async (req, res) => {

    try {

        const username = (req.body.username || '').trim();
        const password = req.body.password || '';

        // 1. Validar campos obligatorios.

        if (!username || !password) {

            return renderLoginError(
                res,
                'danger',
                'Tenés que completar usuario y contraseña.',
                400,
                username
            );
        }

        // 2. Buscar el usuario.

        const user = await Usuario.findOne({
            where: { username }
        });

        if (!user) {

            return renderLoginError(
                res,
                'danger',
                'Usuario y/o contraseña incorrectos.',
                401,
                username
            );
        }

        // 3. Comprobar la contraseña ANTES de informar
        // si la cuenta está suspendida.

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

            return renderLoginError(
                res,
                'danger',
                'Usuario y/o contraseña incorrectos.',
                401,
                username
            );
        }

        // 4. Verificar el estado de la cuenta.

        if (!user.activo) {

            return renderLoginError(
                res,
                'warning',
                'Tu cuenta fue suspendida por incumplimientos de las normas de PicME!. Si considerás que se trata de un error, comunicate con administración.',
                403,
                username
            );
        }

        // 5. Crear la sesión.

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            nombre: user.nombre,
            avatar: user.avatar,
            rol: user.rol || 'usuario'
        };

        // 6. Mensaje de bienvenida.

        req.session.alert = {
            type: 'success',
            text: `Bienvenido/a, ${user.username}.`
        };

        return req.session.save((error) => {

            if (error) {

                console.error('Error al guardar sesión:', error);

                return res.status(500).render('auth/login', {
                    title: 'Iniciar sesión - PicME!',
                    alert: {
                        type: 'danger',
                        text: 'No se pudo iniciar la sesión. Intentá nuevamente.'
                    }
                });
            }

            return res.redirect('/');
        });

    } catch (error) {

        console.error('Error en authController.login:', error);

        return renderLoginError(
            res,
            'danger',
            'Ocurrió un error al intentar iniciar sesión.',
            500
        );
    }
};


exports.register = async (req, res) => {
    try {

        const {
            username,
            email,
            password,
            password_conf,
            nombre
        } = req.body;

        //alerta campo obligatorio
        if (!username || !email || !password || !password_conf) {
            req.session.alert = {
                type: 'danger',
                text: 'Tenés que completar todos los campos obligatorios'
            };
            return saveRedirect(req, res, '/auth/register');
        }

        //usuario >3 caracteres
        if (username.trim().length < 3) {
            req.session.alert = {
                type: 'danger',
                text: 'El nombre de usuario debe tener al menos 3 caracteres.'
            };
            return saveRedirect(req, res, '/auth/register');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.session.alert = {
                type: 'danger',
                text: 'Por favor, ingresá un correo electrónico válido.'
            };
            return saveRedirect(req, res, '/auth/register');
        }

        //contras que deben coincidir
        if (password !== password_conf) {
            req.session.alert = {
                type: 'danger',
                text: 'Las contraseñas no coinciden.'
            };
            return saveRedirect(req, res, '/auth/register');
        }

        //contraseña con al menos 6 caracteres e incluir al menos un número
        const passwordRegex = /^(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            req.session.alert = {
                type: 'danger',
                text: 'La contrasena debe tener al menos 6 caracteres e incluir al menos un número.'
            };
            return saveRedirect(req, res, '/auth/register');
        }


        //verificar mail existente
        const userEmail = await Usuario.findOne({
            where: { email }
        });

        if (userEmail) {
            req.session.alert = {
                type: 'danger',
                text: 'Ese email ya está existe. Probá con otro'
            };
            return saveRedirect(req, res, '/auth/register');
        }

        //verificar usuario existente
        const userUsername = await Usuario.findOne({
            where: { username }
        });
        if (userUsername) {
            req.session.alert = {
                type: 'danger',
                text: 'Ese nombre de usuario ya existe. Probá con otro'
            };
            return saveRedirect(req, res, '/auth/register');
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        await Usuario.create({
            username,
            email,
            password: hashedPassword,
            nombre: nombre,
            rol: 'usuario', //por defecto empezas siendo usuario
            publicaciones_bajadas: 0
        });

        req.session.alert = {
            type: 'success',
            text: 'Usuario registrado correctamente. Ahora podés iniciar sesión.'
        };
        return saveRedirect(req, res, '/auth/login');

    } catch (error) {
        console.error("error al registrar usuario en authController:register", error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al registrar el usuario.'
        };
        return saveRedirect(req, res, '/auth/register');
    }
};


exports.logout = (req, res) => {
    if (!req.session) {
        return res.redirect('/auth/login');
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.clearCookie('connect.sid', { path: '/' });

        return res.redirect('/');
    });
};