
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MOTIVOS_DENUNCIA = [
    'spam',
    'contenido_inapropiado',
    'derechos_autor',
    'acoso',
    'otro'
];
const Denuncia = sequelize.define('Denuncia', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    imagen_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'imagenes',
            key: 'id'
        }
    },
    comentario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'comentarios',
            key: 'id'
        }
    },
    denunciante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    motivo: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
            isIn: [MOTIVOS_DENUNCIA]
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [10, 1000]
        }
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: [[
                'pendiente',
                'desestimada',
                'resuelta',
                'baja'
            ]]
        }
    },
    resuelto_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    resolucion: {
        type: DataTypes.STRING(40),
        allowNull: true
    },
    resuelto_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {

    tableName: 'denuncias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
//porque no se puede denunciar 2 veces
        {
            name: 'uq_denuncia_imagen_usuario',
            unique: true,
            fields: ['imagen_id', 'denunciante_id']
        },
        {
            name: 'uq_denuncia_comentario_usuario',
            unique: true,
            fields: ['comentario_id', 'denunciante_id']
        },
        {
            name: 'idx_denuncias_estado_imagen',
            fields: ['estado', 'imagen_id']
        },
        {
            name: 'idx_denuncias_estado_comentario',
            fields: ['estado', 'comentario_id']
        }

    ],

    //cada denuncia corresponde a 1 solo elemento, o es denuncia x imagen o es denuncia x comentario
    validate: {
        unSoloElementoDenunciado() {
            const tieneImagen =
                this.imagen_id !== null &&
                this.imagen_id !== undefined;

            const tieneComentario =
                this.comentario_id !== null &&
                this.comentario_id !== undefined;

            if (tieneImagen === tieneComentario) {

                throw new Error(
                    'La denuncia debe corresponder a una imagen o a un comentario, pero no a ambos.'
                );

            }
        }

    }

});
Denuncia.MOTIVOS = MOTIVOS_DENUNCIA;
module.exports = Denuncia;