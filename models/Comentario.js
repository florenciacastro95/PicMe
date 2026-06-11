const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comentario = sequelize.define('Comentario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    imagen_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }

}, {
    tableName: 'comentarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Comentario;