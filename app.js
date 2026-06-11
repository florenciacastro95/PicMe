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
const profileRoutes = require('./routes/profile');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/rating');
const searchRoutes = require('./routes/search');
const followRoutes = require('./routes/follow');


const { configVarLocals } = require('./middlewares/auth');

//app
const app = express();


// config de pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
// sesiones
app.use(session({
    secret: process.env.SESSION_SECRET ||'picme',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//middleare para pasarusuario
app.use(configVarLocals);

// rutas
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/profile', profileRoutes);
app.use('/comments', commentRoutes);
app.use('/ratings', ratingRoutes);
app.use('/search', searchRoutes);
app.use('/follow', followRoutes);


//errores 404500
app.use((req, res) => {
    res.status(404).render('errors/404', {
        title: 'Página no encontrada - PicMe!'
    });
});
app.use((err, req, res, next) => {
    console.error("ERROR INTERNO DEL SERVIDOR (MIDDLEWARE GLOBAL):", err);
    res.status(500).render('errors/500', {
        title: 'Error del servidor - PICME'
    });
});
// puerto
const PORT = process.env.PORT || 3000;


//*** */
sequelize.authenticate()
    .then(() => {
        console.log('conectado a Postgres');
        //await sequelize.sync({alter:true});
        console.log('tablas liostas')
    })
    .catch((error)=>{
        console.log('error al conectar conn la db', error);
    });

module.exports = app;