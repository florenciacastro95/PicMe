const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Publicacion = require('./Publicacion');
const Imagen = require('./Imagen');
const Comentario = require('./Comentario');
const Tag = require('./Tag');
const PublicacionTag = require('./PublicacionTag');

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

Publicacion.hasMany(Comentario,{
    foreignKey:'publicacion_id',
    as:'comentarios'
});

Comentario.belongsTo(Publicacion,{
    foreignKey:'publicacion_id',
    as:'publicacion'
});

Usuario.hasMany(Comentario,{
    foreignKey:'usuario_id',
    as:'comentarios'
});

Comentario.belongsTo(Usuario,{
    foreignKey:'usuario_id',
    as:'usuario'
});

Publicacion.belongsToMany(Tag,{
    through:PublicacionTag,
    foreignKey:'publicacion_id',
    otherKey:'tag_id',
    as:'tags'
});

Tag.belongsToMany(Publicacion,{
    through:PublicacionTag,
    foreignKey:'tag_id',
    otherKey:'publicacion_id',
    as:'publicaciones'
});

module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen,
    Comentario,
    Tag,
    PublicacionTag
};