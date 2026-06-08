const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Publicacion = require('./Publicacion');
const Imagen = require('./Imagen');

Usuario.hasMany(Publicacion, {
    foreignKey: 'usuario_id',
    as: 'publicaciones'
});

Publicacion.hasMany(Imagen, {
    foreignKey: 'publicacion_id',
    as: 'imagenes'
});

Imagen.belongsTo(Publicacion, {
    foreignKey: 'publicacion_id',
    as: 'publicacion'
});

Publicacion.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen
};