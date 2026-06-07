const isAuthenticated = (req, res, next) => {
    if(req.session.user){
        return next();
    }

    return res.redirect('/auth/login');
};

const isNotAuthenticated = (req, res, next) => {
    if(req.session.user){
        return res.redirect('/');
    }

    next();
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated
};