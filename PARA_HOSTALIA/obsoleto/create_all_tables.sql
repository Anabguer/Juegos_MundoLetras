-- Crear todas las tablas necesarias para Mundo Letras
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Crear tabla usuarios_aplicaciones
CREATE TABLE IF NOT EXISTS usuarios_aplicaciones (
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    usuario_id INT NOT NULL,
    aplicacion_id INT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_aplicacion_key),
    INDEX idx_usuario (usuario_id),
    INDEX idx_aplicacion (aplicacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crear tabla mundoletras_temas
CREATE TABLE IF NOT EXISTS mundoletras_temas (
    tema_id INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL DEFAULT 'mundoletras',
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    color VARCHAR(7) NULL,
    icono VARCHAR(50) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tema_id),
    INDEX idx_codigo (codigo),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla mundoletras_progreso
CREATE TABLE IF NOT EXISTS mundoletras_progreso (
    progreso_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nivel_max INT NOT NULL DEFAULT 1,
    monedas INT NOT NULL DEFAULT 0,
    puntuacion_total INT NOT NULL DEFAULT 0,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (progreso_id),
    UNIQUE KEY unique_user_progress (usuario_aplicacion_key),
    INDEX idx_progreso_nivel (nivel_max),
    INDEX idx_progreso_monedas (monedas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear tabla mundoletras_niveles
CREATE TABLE IF NOT EXISTS mundoletras_niveles (
    nivel_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nivel INT NOT NULL,
    tema_id INT NOT NULL,
    puntuacion INT NOT NULL DEFAULT 0,
    completado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (nivel_id),
    UNIQUE KEY unique_user_level (usuario_aplicacion_key, nivel),
    INDEX idx_usuario (usuario_aplicacion_key),
    INDEX idx_nivel (nivel),
    INDEX idx_tema (tema_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Crear tabla mundoletras_scores
CREATE TABLE IF NOT EXISTS mundoletras_scores (
    score_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nivel INT NOT NULL,
    puntuacion INT NOT NULL DEFAULT 0,
    tiempo_ms INT NOT NULL DEFAULT 0,
    errores INT NOT NULL DEFAULT 0,
    racha INT NOT NULL DEFAULT 0,
    completado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (score_id),
    UNIQUE KEY unique_user_level_score (usuario_aplicacion_key, nivel),
    INDEX idx_usuario (usuario_aplicacion_key),
    INDEX idx_nivel (nivel),
    INDEX idx_puntuacion (puntuacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Crear tabla mundoletras_ranking_cache
CREATE TABLE IF NOT EXISTS mundoletras_ranking_cache (
    ranking_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nombre_usuario VARCHAR(100) NOT NULL,
    email_usuario VARCHAR(150) NOT NULL,
    nivel_max INT NOT NULL DEFAULT 1,
    puntuacion_total INT NOT NULL DEFAULT 0,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ranking_id),
    UNIQUE KEY unique_user_ranking (usuario_aplicacion_key),
    INDEX idx_puntuacion (puntuacion_total),
    INDEX idx_nivel (nivel_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Crear tabla mundoletras_boosters
CREATE TABLE IF NOT EXISTS mundoletras_boosters (
    booster_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    tipo_booster VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booster_id),
    UNIQUE KEY unique_user_booster (usuario_aplicacion_key, tipo_booster),
    INDEX idx_usuario (usuario_aplicacion_key),
    INDEX idx_tipo (tipo_booster)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Agregar claves foráneas después de crear todas las tablas
ALTER TABLE mundoletras_progreso 
ADD CONSTRAINT mundoletras_progreso_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

ALTER TABLE mundoletras_niveles 
ADD CONSTRAINT mundoletras_niveles_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

ALTER TABLE mundoletras_niveles 
ADD CONSTRAINT mundoletras_niveles_fk2 
FOREIGN KEY (tema_id) REFERENCES mundoletras_temas (tema_id) ON DELETE CASCADE;

ALTER TABLE mundoletras_scores 
ADD CONSTRAINT mundoletras_scores_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

ALTER TABLE mundoletras_ranking_cache 
ADD CONSTRAINT mundoletras_ranking_cache_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

ALTER TABLE mundoletras_boosters 
ADD CONSTRAINT mundoletras_boosters_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
