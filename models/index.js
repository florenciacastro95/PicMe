const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Publicacion = require('./Publicacion');

Usuario.hasMany(Publicacion, {
    foreignKey: 'usuario_id',
    as: 'publicaciones'
});

Publicacion.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
});

module.exports = {
    sequelize,
    Usuario,
    Publicacion
};