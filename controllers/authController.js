const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

exports.showLogin = (req, res) => {
    res.render('auth/login');
};

exports.showRegister = (req, res) => {
    res.render('auth/register');
};

exports.login = async (req, res) => {
    try {
        console.log("esta llamandose a auth controller login")
        const { username, password } = req.body;
        console.log(req.body);

        //campos vacios
        if (!username || !password) {
            req.session.alert = {
                type: 'danger',
                text: 'Tenés que completar usuario y contraseña.'
            };
            return res.redirect('/auth/login');
        }
        /*
                const user = await Usuario.findOne({
                    where: { username }
                });
        
                console.log(user);*/
        const usuarios = await Usuario.findAll();

        console.log(
            usuarios.map(u => u.toJSON())
        );

        const user = await Usuario.findOne({
            where: { username }
        });
        //error usuario/contra
        if (!user) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario o contraseña incorrectos.'
            };
            return res.redirect('/auth/login');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log(passwordMatch);
        if (!passwordMatch) {
            req.session.alert = {
                type: 'danger',
                text: 'Usuario o contraseña incorrectos.'
            };
            return res.redirect('/auth/login');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            nombre: user.nombre || null
        };

        req.session.alert = {
            type: 'success',
            text: `Bienvenido/a, ${user.username}.`
        };

        return res.redirect('/');
    } catch (error) {
        console.error('error en login authController', error);

        req.session.alert = {
            type: 'danger',
            text: 'Hubo un error al iniciar sesión.'
        };
    }
    res.redirect('/');
};

exports.register = async (req, res) => {
    try {
        console.log("1")
        const {
            username,
            email,
            password,
            password_conf,
            nombre
        } = req.body;
        console.log(req.body);
        console.log("2");
        console.log({
            username,
            email,
            password,
            password_conf,
            nombre
        })
        //alerta campo obligatorio
        if (!username || !email || !password || !password_conf) {
            req.session.alert = {
                type: 'danger',
                text: 'Tenés que completar todos los campos obligatorios'
            };
            return res.redirect('/auth/register');
        }
        console.log("3");
        //contras que deben coincidir
        if (password !== password_conf) {
            req.session.alert = {
                type: 'danger',
                text: 'Las contraseñas no coinciden.'
            };
            return res.redirect('/auth/register');
        }
        console.log("4");
        //verificar mail existente
        const userEmail = await Usuario.findOne({
            where: { email }
        });

        if (userEmail) {
            req.session.alert = {
                type: 'danger',
                text: 'Ese email ya está existe. Probá con otro'
            };
            return res.redirect('/auth/register');
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
            return res.redirect('/auth/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('usuario listolas para guardar');
        const newwuser = await Usuario.create({
            username,
            email,
            password: hashedPassword,
            nombre: nombre
        });

        console.log(newwuser.toJSON());
        req.session.alert = {
            type: 'success',
            text: 'Usuario registrado correctamente. Ahora podés iniciar sesión.'
        };

        res.redirect('/auth/login');

    } catch (error) {
        console.log("error al registrar usuario en authController:register" + error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al registrar el usuario.'
        };

        res.redirect('/auth/register');
    }
};





exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};