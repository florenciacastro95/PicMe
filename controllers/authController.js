const bcrypt = require('bcrypt');
const { Usuario } = require('../models');

exports.showLogin = (req, res) => {
    res.render('auth/login');
    console.log("aca iria el login.pug")
};

exports.showRegister = (req, res) => {
    res.render('auth/register');
    console.log("aca iria el register.pug")
};

exports.login = (req, res) => {
    console.log('login pendiente');
    res.redirect('/');
};

exports.register = async (req, res) => {
    try {

        const {
            username,
            email,
            password
        } = req.body;

        const userExists = await Usuario.findOne({
            where: { email }
        });

        if(userExists){
            return res.redirect('/auth/register');
        }

        console.log('usuario listolas para guardar');
        await Usuario.create({
            username,
            email,
            password
        });
        console.log('usuario guardado');
        res.redirect('/auth/login');

    } catch(error){
        console.log(error);
        res.redirect('/auth/register');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};