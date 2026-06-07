DROP TABLE IF EXISTS publicaciones_tags CASCADE;
DROP TABLE IF EXISTS valoraciones CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS seguidores CASCADE;
DROP TABLE IF EXISTS imagenes CASCADE;
DROP TABLE IF EXISTS publicaciones CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;


CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);


CREATE TABLE publicaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    comentarios_habilitados BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_publicacion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_titulo_not_empty CHECK (LENGTH(TRIM(titulo)) > 0)
);

CREATE TABLE imagenes (
    id SERIAL PRIMARY KEY,
    publicacion_id INTEGER NOT NULL,
    url VARCHAR(255) NOT NULL,
    titulo VARCHAR(200),
    descripcion TEXT,
    copyright VARCHAR(20) DEFAULT 'sin_copyright' NOT NULL,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_imagen_publicacion FOREIGN KEY (publicacion_id)
        REFERENCES publicaciones(id) ON DELETE CASCADE,
    CONSTRAINT chk_copyright_values CHECK (copyright IN ('copyright', 'sin_copyright'))
);


CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    imagen_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_comentario_imagen FOREIGN KEY (imagen_id)
        REFERENCES imagenes(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_contenido_not_empty CHECK (LENGTH(TRIM(contenido)) > 0)
);


CREATE TABLE valoraciones (
    id SERIAL PRIMARY KEY,
    imagen_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    puntuacion INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_valoracion_imagen FOREIGN KEY (imagen_id)
        REFERENCES imagenes(id) ON DELETE CASCADE,
    CONSTRAINT fk_valoracion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_puntuacion_range CHECK (puntuacion >= 1 AND puntuacion <= 5),
    CONSTRAINT uq_imagen_usuario UNIQUE (imagen_id, usuario_id)
);


CREATE TABLE seguidores (
    id SERIAL PRIMARY KEY,
    seguidor_id INTEGER NOT NULL,
    seguido_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_seguidor FOREIGN KEY (seguidor_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_seguido FOREIGN KEY (seguido_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_follow CHECK (seguidor_id != seguido_id),
    CONSTRAINT uq_seguidor_seguido UNIQUE (seguidor_id, seguido_id)
);


CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tag_not_empty CHECK (LENGTH(TRIM(nombre)) > 0)
);


CREATE TABLE publicaciones_tags (
    id SERIAL PRIMARY KEY,
    publicacion_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pt_publicacion FOREIGN KEY (publicacion_id)
        REFERENCES publicaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id)
        REFERENCES tags(id) ON DELETE CASCADE,
    CONSTRAINT uq_publicacion_tag UNIQUE (publicacion_id, tag_id)
);
