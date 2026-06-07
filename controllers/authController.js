exports.showLogin = (req, res) => {
    res.render('auth/login');
    console.log("aca iria el login.pug")
};

exports.showRegister = (req, res) => {
    res.render('auth/register');
    console.log("aca iria el register.pug")
};