// variables de entorno
require('dotenv').config();


const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

//importar rutas
const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');

//app
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// config de pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// archivos estaticos

app.use(express.static(path.join(__dirname, 'public')));

// sesiones
app.use(session({
    secret: 'picme',
    resave: false,
    saveUninitialized: false
}));


//middleare para pasarusuario
app.use((req,res,next)=>{
    res.locals.user = req.session.user || null;
    next();
});

// rutas
app.use('/', homeRoutes);
app.use('/auth', authRoutes);

// puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor andando en puerto ${PORT}`);
});

module.exports = app;