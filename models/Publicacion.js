const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Publicacion = sequelize.define('Publicacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 200]
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    comentarios_habilitados: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'publicaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Publicacion;
