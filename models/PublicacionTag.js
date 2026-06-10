const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PublicacionTag = sequelize.define('PublicacionTag', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    publicacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'publicaciones',
            key: 'id'
        }
    },

    tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tags',
            key: 'id'
        }
    }

}, {
    tableName: 'publicaciones_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = PublicacionTag;