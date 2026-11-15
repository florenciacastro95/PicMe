
require('dotenv').config();

const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const ejecutarMigracion = async () => {

    const host = (process.env.DB_HOST || '').trim().toLowerCase();
    const database = (process.env.DB_NAME || '').trim();

    const target = process.env.DB_TARGET;
    const expectedEndpoint = (
        process.env.NEON_DEV_ENDPOINT_ID || ''
    ).trim().toLowerCase();

    let conectado = false;

    try {

        // ==========================================
        // 1. PROTECCIONES DEL DESTINO
        // ==========================================

        console.log('\n===================================');
        console.log('MIGRACIÓN PICME - DENUNCIAS');
        console.log('===================================');

        console.log('Destino declarado:', target);
        console.log('Host:', host);
        console.log('Base:', database);

        if (sequelize.getDialect() !== 'postgres') {
            throw new Error('Se requiere PostgreSQL.');
        }

        if (target !== 'dev-denuncias') {
            throw new Error(
                'Destino incorrecto. DB_TARGET debe ser dev-denuncias.'
            );
        }

        if (!host.endsWith('.neon.tech')) {
            throw new Error(
                'El host configurado no corresponde a un endpoint de Neon.'
            );
        }

        if (!expectedEndpoint) {
            throw new Error(
                'Falta NEON_DEV_ENDPOINT_ID en el archivo .env.'
            );
        }

        if (!host.includes(expectedEndpoint)) {
            throw new Error(
                'El DB_HOST no coincide con el endpoint declarado para dev-denuncias.'
            );
        }

        if (process.env.CONFIRMAR_MIGRACION !== 'SI') {
            throw new Error(
                'Falta CONFIRMAR_MIGRACION=SI.'
            );
        }

        if (process.env.CONFIRMAR_DB_REMOTA !== 'SI') {
            throw new Error(
                'Falta CONFIRMAR_DB_REMOTA=SI.'
            );
        }

        // ==========================================
        // 2. CONECTAR Y VERIFICAR LA BASE REAL
        // ==========================================

        await sequelize.authenticate();
        conectado = true;

        const info = await sequelize.query(`
            SELECT
                current_database() AS base,
                current_user AS usuario,
                version() AS version
        `, {
            type: QueryTypes.SELECT
        });

        console.log('\nConexión establecida.');
        console.log('Base conectada:', info[0].base);

        if (info[0].base !== database) {
            throw new Error(
                'La base conectada no coincide con DB_NAME.'
            );
        }

        // ==========================================
        // 3. COMPROBAR LAS TABLAS EXISTENTES
        // ==========================================

        const tablas = await sequelize.query(`
            SELECT
                to_regclass('public.usuarios') AS usuarios,
                to_regclass('public.imagenes') AS imagenes,
                to_regclass('public.comentarios') AS comentarios,
                to_regclass('public.publicaciones') AS publicaciones,
                to_regclass('public.denuncias') AS denuncias
        `, {
            type: QueryTypes.SELECT
        });

        const existentes = tablas[0];

        const requeridas = [
            'usuarios',
            'imagenes',
            'comentarios',
            'publicaciones'
        ];

        for (const tabla of requeridas) {

            if (!existentes[tabla]) {
                throw new Error(
                    `No existe la tabla public.${tabla}.`
                );
            }
        }

        // No sobrescribimos una tabla que ya exista.
        if (existentes.denuncias) {
            throw new Error(
                'La tabla denuncias ya existe. No se repetirá la migración automáticamente.'
            );
        }

        console.log('Tablas originales verificadas.');

        // ==========================================
        // 4. EJECUTAR MIGRACIÓN TRANSACCIONAL
        // ==========================================

        await sequelize.transaction(async (transaction) => {

            // --------------------------------------
            // A. AGREGAR ROL A USUARIOS
            // --------------------------------------

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ADD COLUMN IF NOT EXISTS rol VARCHAR(20)
                DEFAULT 'usuario';
            `, { transaction });

            await sequelize.query(`
                UPDATE public.usuarios
                SET rol = 'usuario'
                WHERE rol IS NULL
                   OR TRIM(rol) = '';
            `, { transaction });

            // No permitimos valores de rol desconocidos.
            const rolesInvalidos = await sequelize.query(`
                SELECT DISTINCT rol
                FROM public.usuarios
                WHERE rol NOT IN (
                    'usuario',
                    'validador',
                    'admin'
                )
                OR rol IS NULL;
            `, {
                transaction,
                type: QueryTypes.SELECT
            });

            if (rolesInvalidos.length > 0) {
                throw new Error(
                    'Existen roles inválidos en usuarios.'
                );
            }

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ALTER COLUMN rol SET DEFAULT 'usuario';
            `, { transaction });

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ALTER COLUMN rol SET NOT NULL;
            `, { transaction });


            // --------------------------------------
            // B. AGREGAR CONTADOR DE BAJAS
            // --------------------------------------

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ADD COLUMN IF NOT EXISTS publicaciones_bajadas
                INTEGER DEFAULT 0;
            `, { transaction });

            await sequelize.query(`
                UPDATE public.usuarios
                SET publicaciones_bajadas = 0
                WHERE publicaciones_bajadas IS NULL;
            `, { transaction });

            const bajasInvalidas = await sequelize.query(`
                SELECT id, publicaciones_bajadas
                FROM public.usuarios
                WHERE publicaciones_bajadas < 0;
            `, {
                transaction,
                type: QueryTypes.SELECT
            });

            if (bajasInvalidas.length > 0) {
                throw new Error(
                    'Hay contadores de bajas negativos en usuarios.'
                );
            }

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ALTER COLUMN publicaciones_bajadas SET DEFAULT 0;
            `, { transaction });

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ALTER COLUMN publicaciones_bajadas SET NOT NULL;
            `, { transaction });


            // --------------------------------------
            // C. RESTRICCIONES DE USUARIOS
            // --------------------------------------

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ADD CONSTRAINT chk_usuarios_rol
                CHECK (
                    rol IN ('usuario', 'validador', 'admin')
                );
            `, { transaction });

            await sequelize.query(`
                ALTER TABLE public.usuarios
                ADD CONSTRAINT chk_publicaciones_bajadas
                CHECK (publicaciones_bajadas >= 0);
            `, { transaction });


            // --------------------------------------
            // D. CREAR TABLA DENUNCIAS
            // --------------------------------------

            await sequelize.query(`
                CREATE TABLE public.denuncias (

                    id SERIAL PRIMARY KEY,

                    imagen_id INTEGER NULL,

                    comentario_id INTEGER NULL,

                    denunciante_id INTEGER NOT NULL,

                    motivo VARCHAR(40) NOT NULL,

                    descripcion TEXT NOT NULL,

                    estado VARCHAR(20)
                        NOT NULL DEFAULT 'pendiente',

                    resuelto_por INTEGER NULL,

                    resolucion VARCHAR(40) NULL,

                    resuelto_at TIMESTAMP WITH TIME ZONE NULL,

                    created_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP,

                    updated_at TIMESTAMP WITH TIME ZONE
                        NOT NULL DEFAULT CURRENT_TIMESTAMP,

                    CONSTRAINT fk_denuncia_imagen
                        FOREIGN KEY (imagen_id)
                        REFERENCES public.imagenes(id)
                        ON DELETE CASCADE,

                    CONSTRAINT fk_denuncia_comentario
                        FOREIGN KEY (comentario_id)
                        REFERENCES public.comentarios(id)
                        ON DELETE CASCADE,

                    CONSTRAINT fk_denuncia_usuario
                        FOREIGN KEY (denunciante_id)
                        REFERENCES public.usuarios(id)
                        ON DELETE CASCADE,

                    CONSTRAINT fk_denuncia_resolvedor
                        FOREIGN KEY (resuelto_por)
                        REFERENCES public.usuarios(id)
                        ON DELETE SET NULL,

                    CONSTRAINT chk_denuncia_elemento
                        CHECK (
                            (
                                imagen_id IS NOT NULL
                                AND comentario_id IS NULL
                            )
                            OR
                            (
                                imagen_id IS NULL
                                AND comentario_id IS NOT NULL
                            )
                        ),

                    CONSTRAINT chk_denuncia_motivo
                        CHECK (
                            motivo IN (
                                'spam',
                                'contenido_inapropiado',
                                'derechos_autor',
                                'acoso',
                                'otro'
                            )
                        ),

                    CONSTRAINT chk_denuncia_estado
                        CHECK (
                            estado IN (
                                'pendiente',
                                'desestimada',
                                'resuelta',
                                'baja'
                            )
                        ),

                    CONSTRAINT chk_denuncia_descripcion
                        CHECK (
                            CHAR_LENGTH(TRIM(descripcion))
                            BETWEEN 10 AND 1000
                        )

                );
            `, { transaction });


            // --------------------------------------
            // E. ÍNDICES PARA EVITAR DUPLICADOS
            // --------------------------------------

            await sequelize.query(`
                CREATE UNIQUE INDEX
                uq_denuncia_imagen_usuario
                ON public.denuncias (
                    imagen_id,
                    denunciante_id
                );
            `, { transaction });

            await sequelize.query(`
                CREATE UNIQUE INDEX
                uq_denuncia_comentario_usuario
                ON public.denuncias (
                    comentario_id,
                    denunciante_id
                );
            `, { transaction });


            // --------------------------------------
            // F. ÍNDICES PARA MODERACIÓN
            // --------------------------------------

            await sequelize.query(`
                CREATE INDEX idx_denuncias_estado_imagen
                ON public.denuncias (estado, imagen_id);
            `, { transaction });

            await sequelize.query(`
                CREATE INDEX idx_denuncias_estado_comentario
                ON public.denuncias (estado, comentario_id);
            `, { transaction });

        });


        // ==========================================
        // 5. VERIFICACIÓN FINAL
        // ==========================================

        const resultado = await sequelize.query(`
            SELECT
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name IN (
                  'usuarios',
                  'denuncias'
              )
            ORDER BY table_name, ordinal_position;
        `, {
            type: QueryTypes.SELECT
        });

        console.log('\nMigración completada correctamente.');
        console.log('Columnas verificadas:', resultado.length);

        console.table(resultado);

        console.log('\n===================================');
        console.log('PICME - MIGRACIÓN FINALIZADA');
        console.log('===================================');

    } catch (error) {

        console.error('\n===================================');
        console.error('ERROR EN LA MIGRACIÓN');
        console.error(error.message);
        console.error('===================================');

        console.error(
            'Si falló dentro de la transacción, los cambios de esa transacción fueron revertidos.'
        );

        process.exitCode = 1;

    } finally {

        if (conectado) {
            await sequelize.close();
        }

    }
};

ejecutarMigracion();
