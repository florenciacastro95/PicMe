const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seguidor = sequelize.define('Seguidor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    seguidor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    seguido_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    }
}, {
    tableName: 'seguidores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['seguidor_id', 'seguido_id']
        }
    ]
});

module.exports = Seguidor;
