const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Imagen = sequelize.define('Imagen', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    publicacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'imagenes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Imagen;