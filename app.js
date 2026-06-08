// variables de entorno
require('dotenv').config();


const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const { sequelize } = require('./models');

//importar rutas
const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile')
const { configVarLocals } = require('./middlewares/auth');

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
app.use(configVarLocals);

// rutas
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/profile', profileRoutes);

app.use((req, res) => {
    res.status(404).send('404 Pág no encontrada');
});
app.use((req,res,next)=>{

    res.locals.user = req.session.user || null;
    res.locals.alert = req.session.alert || null;

    delete req.session.alert;

    next();

});
// puerto
const PORT = process.env.PORT || 3000;


//*** */
sequelize.authenticate()
    .then(() => {
        console.log('conectado a Postgres');
    })
    .catch((error)=>{
        console.log('error al conectar conn la db', error);
    });

module.exports = app;