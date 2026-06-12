const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

exports.showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Iniciar sesión - PicME!'
    });
};

exports.showRegister = (req, res) => {
    res.render('auth/register',
        {
            title: 'Registrarse - PicME!'
        }
    );
};

exports.login = async (req, res) => {
    try {
        console.log("esta llamandose a auth controller login")
        console.log(req.body);

        const { username, password } = req.body;
        //campos vacios
        if (!username || !password) {
            req.session.alert = {
                type: 'danger',
                text: 'Tenés que completar usuario y contraseña.'
            };
            return req.session.save(() => {return res.redirect('/auth/login');});
        }

        const user = await Usuario.findOne({
            where: { username:username.trim() }
        });
        //usuario non-existance :v
        if (!user) {
            req.session.alert = {
                type: 'danger',
                text: 'El nombre de usuario ingresado no existe.'
            };
            return req.session.save(() => {return res.redirect('/auth/login');});
        }

        //usaurio inactivo para despues 
        if (!user.activo) {
            req.session.alert = {
                type: 'warning', 
                text: 'Tu cuenta se encuentra inactiva. Comunicate con soporte.'
            };
            return req.session.save(() => {return res.redirect('/auth/login');});
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log(passwordMatch);
        if (!passwordMatch) {
            req.session.alert = {
                type: 'danger',
                text: 'La contraseña ingresada es incorrecta.'
            };
            return req.session.save(() => {return res.redirect('/auth/login');});
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            nombre: user.nombre,
            avatar: user.avatar
        };

        req.session.alert = {
            type: 'success',
            text: `Bienvenido/a, ${user.username}.`
        };
        req.session.save(() => {
            return res.redirect('/');
        });
    } catch (error) {
        console.error('error en login authController', error);

        req.session.alert = {
            type: 'danger',
            text: 'Hubo un error al iniciar sesión.'
        }; return res.redirect('/auth/login');
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
            return req.session.save(() => {return res.redirect('/auth/register');});
        }
        
        //usuario >3 caracteres
        if (username.trim().length < 3) {
            req.session.alert = {
                type: 'danger',
                text: 'El nombre de usuario debe tener al menos 3 caracteres.'
            };
            return req.session.save(() => {return res.redirect('/auth/register');});
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.session.alert = {
                type: 'danger',
                text: 'Por favor, ingresá un correo electrónico válido.'
            };
            return req.session.save(() => {return res.redirect('/auth/register');});
        }
        
        //contras que deben coincidir
        if (password !== password_conf) {
            req.session.alert = {
                type: 'danger',
                text: 'Las contraseñas no coinciden.'
            };
            return req.session.save(() => {return res.redirect('/auth/register');});
        }
        
        //contraseña con al menos 6 caracteres e incluir al menos un número
        const passwordRegex = /^(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            req.session.alert = {
                type: 'danger',
                text: 'La contrasena debe tener al menos 6 caracteres e incluir al menos un número.'
            };
            return req.session.save(() => {return res.redirect('/auth/register');});
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
            return req.session.save(() => {return res.redirect('/auth/register');});
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
            return req.session.save(() => {return res.redirect('/auth/register');});
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
        req.session.save(() => {
            return res.redirect('/auth/login');
        });

    } catch (error) {
        console.log("error al registrar usuario en authController:register" + error);
        req.session.alert = {
            type: 'danger',
            text: 'Error al registrar el usuario.'
        };

        return req.session.save(() => {return res.redirect('/auth/register');});
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