const isAuthenticated = (req, res, next) => {
    if(req.session && req.session.user){
        return next();
    }
    req.session.alert = {
        type: 'warning',
        text: 'Tenés que iniciar sesión para acceder a esta página.'
    };
    return res.redirect('/auth/login');
};

const isNotAuthenticated = (req, res, next) => {
    if(req.session.user){
        return res.redirect('/');
    }

    next();
};
const configVarLocals = (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.alert = req.session.alert || null;
    delete req.session.alert;
    next();
};
module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    configVarLocals
};