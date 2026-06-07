// variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
//importar rutas
const homeRoutes = require('./routes/home');

const app = express();

// config de pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));
// rutas
app.use('/', homeRoutes);


// puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor andando en puerto ${PORT}`);
});

module.exports = app;