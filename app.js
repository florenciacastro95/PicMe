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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


// config de pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// archivos estaticos

app.use(express.static(path.join(__dirname, 'public')));

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
    res.status(404).send('404 Pág no encontrada');
});
app.use((err, req, res, next) => {
    res.status(500).send('Hubo un error interno en el servidor');
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