// variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// config de pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

// ruta provisoria 
app.get('/', (req, res) => {
    res.render('index', {
        title: 'PICME'
    });
});

// puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor andando en puerto ${PORT}`);
});

module.exports = app;