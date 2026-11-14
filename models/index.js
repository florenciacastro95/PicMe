const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Publicacion = require('./Publicacion');
const Imagen = require('./Imagen');
const Comentario = require('./Comentario');
const Tag = require('./Tag');
const PublicacionTag = require('./PublicacionTag');
const Rating = require('./Rating');
const Seguidor = require('./Seguidor');
const Denuncia = require('./Denuncia');

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

Imagen.hasMany(Comentario,{
    foreignKey: 'imagen_id',
    as:'comentarios',
    onDelete: 'CASCADE'
});

Comentario.belongsTo(Imagen,{
    foreignKey:'imagen_id',
    as:'imagen'
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

Usuario.hasMany(Rating, { 
    foreignKey: 'usuario_id', 
    as: 'valoraciones'
});
Rating.belongsTo(Usuario, { 
    foreignKey: 'usuario_id',
    as: 'usuario'
});

Imagen.hasMany(Rating, {
    foreignKey: 'imagen_id',
    as: 'ratings'
});

Rating.belongsTo(Imagen, {
    foreignKey: 'imagen_id',
    as: 'imagen'
});
Usuario.belongsToMany(Usuario, {
    through: Seguidor,
    as: 'seguidos',
    foreignKey: 'seguidor_id',
    otherKey: 'seguido_id'
});

Usuario.belongsToMany(Usuario, {
    through: Seguidor,
    as: 'seguidores',
    foreignKey: 'seguido_id',
    otherKey: 'seguidor_id'
});

Seguidor.belongsTo(Usuario, {
    foreignKey: 'seguidor_id',
    as: 'seguidor'
});

Seguidor.belongsTo(Usuario, {
    foreignKey: 'seguido_id',
    as: 'seguido'
});

Imagen.hasMany(Denuncia, {
    foreignKey: 'imagen_id',
    as: 'denuncias'
});

Denuncia.belongsTo(Imagen, {
    foreignKey: 'imagen_id',
    as: 'imagen'
});

Comentario.hasMany(Denuncia, {
    foreignKey: 'comentario_id',
    as: 'denuncias'
});

Denuncia.belongsTo(Comentario, {
    foreignKey: 'comentario_id',
    as: 'comentario'
});

Usuario.hasMany(Denuncia, {
    foreignKey: 'denunciante_id',
    as: 'denunciasRealizadas'
});

Denuncia.belongsTo(Usuario, {
    foreignKey: 'denunciante_id',
    as: 'denunciante'
});

Usuario.hasMany(Denuncia, {
    foreignKey: 'resuelto_por',
    as: 'denunciasResueltas'
});

Denuncia.belongsTo(Usuario, {
    foreignKey: 'resuelto_por',
    as: 'validador'
});








module.exports = {
    sequelize,
    Usuario,
    Publicacion,
    Imagen,
    Comentario,
    Tag,
    PublicacionTag,
    Rating,
    Seguidor,
    Denuncia
};