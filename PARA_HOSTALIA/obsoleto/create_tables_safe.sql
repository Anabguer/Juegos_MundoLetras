-- ============================================
-- SCRIPT SQL SEGURO PARA MUNDO LETRAS
-- Sistema Multi-Aplicación Hostalia
-- ============================================

-- Usar la base de datos del sistema
USE 9606966_sistema_apps_db;

-- Desactivar temporalmente las foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 0. VERIFICACIONES PREVIAS
-- ============================================

SELECT 'Verificando base de datos...' as Status;
SELECT DATABASE() as 'Base de datos actual';

-- Mostrar tablas existentes
SELECT 'Tablas existentes relacionadas con usuarios:' as Info;
SHOW TABLES LIKE '%usuario%';

-- ============================================
-- 1. INSERTAR APLICACIÓN EN EL REGISTRO
-- ============================================

SELECT 'Registrando aplicación Mundo Letras...' as Status;

-- Verificar si existe la tabla aplicaciones
CREATE TABLE IF NOT EXISTS aplicaciones (
    app_id INT(11) NOT NULL AUTO_INCREMENT,
    app_codigo VARCHAR(50) NOT NULL,
    app_nombre VARCHAR(100) NOT NULL,
    app_descripcion TEXT,
    activa TINYINT(1) DEFAULT 1,
    PRIMARY KEY (app_id),
    UNIQUE KEY unique_app_codigo (app_codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar la aplicación mundoletras si no existe
INSERT IGNORE INTO aplicaciones (app_codigo, app_nombre, app_descripcion, activa) 
VALUES ('mundoletras', 'Mundo Letras', 'Juego de sopa de letras con más de 1000 niveles', 1);

-- ============================================
-- 2. TABLA DE USUARIOS (SI NO EXISTE)
-- ============================================

SELECT 'Verificando tabla de usuarios...' as Status;

-- Crear tabla de usuarios si no existe (compatible con sistema existente)
CREATE TABLE IF NOT EXISTS usuarios_aplicaciones (
    usuario_aplicacion_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    app_codigo VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    activo TINYINT(1) DEFAULT 0,
    configuracion TEXT NULL,
    verification_code VARCHAR(10) NULL,
    verification_expiry TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    PRIMARY KEY (usuario_aplicacion_id),
    UNIQUE KEY unique_user_key (usuario_aplicacion_key),
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_app_codigo (app_codigo),
    INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABLAS ESPECÍFICAS DE MUNDO LETRAS
-- ============================================

SELECT 'Creando tablas de Mundo Letras...' as Status;

-- Tabla de temas (sin foreign keys)
CREATE TABLE IF NOT EXISTS mundoletras_temas (
    tema_id INT(11) NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    emoji VARCHAR(10),
    color VARCHAR(7) DEFAULT '#1e40af',
    idioma VARCHAR(10) NOT NULL DEFAULT 'es',
    activo TINYINT(1) DEFAULT 1,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tema_id),
    UNIQUE KEY unique_tema_codigo (codigo),
    INDEX idx_temas_activo (activo),
    INDEX idx_temas_idioma (idioma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de niveles (sin foreign keys)
CREATE TABLE IF NOT EXISTS mundoletras_niveles (
    nivel_id INT(11) NOT NULL AUTO_INCREMENT,
    nivel_numero INT NOT NULL,
    tema_id INT NOT NULL,
    seed VARCHAR(64) NOT NULL,
    config_json JSON NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (nivel_id),
    UNIQUE KEY unique_nivel_numero (nivel_numero),
    INDEX idx_niveles_tema (tema_id),
    INDEX idx_niveles_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de progreso del usuario (sin foreign keys inicialmente)
CREATE TABLE IF NOT EXISTS mundoletras_progreso (
    progreso_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nivel_max INT NOT NULL DEFAULT 1,
    monedas INT NOT NULL DEFAULT 0,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (progreso_id),
    UNIQUE KEY unique_user_progress (usuario_aplicacion_key),
    INDEX idx_progreso_nivel (nivel_max),
    INDEX idx_progreso_monedas (monedas)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de puntuaciones (sin foreign keys inicialmente)
CREATE TABLE IF NOT EXISTS mundoletras_scores (
    score_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    nivel_id INT NOT NULL,
    score INT NOT NULL,
    tiempo_ms INT NOT NULL DEFAULT 0,
    estrellas TINYINT(1) DEFAULT 1,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_hash VARCHAR(64) NULL,
    validado TINYINT(1) DEFAULT 0,
    PRIMARY KEY (score_id),
    INDEX idx_scores_usuario (usuario_aplicacion_key),
    INDEX idx_scores_nivel (nivel_id),
    INDEX idx_scores_fecha (fecha),
    INDEX idx_scores_score (score),
    INDEX idx_scores_validado (validado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de cache de ranking
CREATE TABLE IF NOT EXISTS mundoletras_ranking_cache (
    cache_id INT(11) NOT NULL AUTO_INCREMENT,
    tipo ENUM('global','semanal','nivel') NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    payload_json JSON NOT NULL,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expira_at TIMESTAMP NULL,
    PRIMARY KEY (cache_id),
    UNIQUE KEY unique_cache_tipo_periodo (tipo, periodo),
    INDEX idx_cache_tipo (tipo),
    INDEX idx_cache_expira (expira_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de boosters del usuario (sin foreign keys inicialmente)
CREATE TABLE IF NOT EXISTS mundoletras_boosters (
    booster_id INT(11) NOT NULL AUTO_INCREMENT,
    usuario_aplicacion_key VARCHAR(150) NOT NULL,
    tipo ENUM('pista','revelar_letra','quitar_niebla') NOT NULL,
    cantidad INT NOT NULL DEFAULT 0,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booster_id),
    UNIQUE KEY unique_user_booster (usuario_aplicacion_key, tipo),
    INDEX idx_boosters_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. AGREGAR FOREIGN KEYS (SI ES POSIBLE)
-- ============================================

SELECT 'Intentando agregar foreign keys...' as Status;

-- Verificar si la columna usuario_aplicacion_key existe en usuarios_aplicaciones
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = '9606966_sistema_apps_db' 
    AND TABLE_NAME = 'usuarios_aplicaciones' 
    AND COLUMN_NAME = 'usuario_aplicacion_key'
);

-- Solo agregar foreign keys si la columna existe
SET @sql_progreso = IF(@column_exists > 0,
    'ALTER TABLE mundoletras_progreso ADD CONSTRAINT mundoletras_progreso_fk1 FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE',
    'SELECT "No se pudo agregar FK para progreso - columna no existe" as Warning'
);

SET @sql_scores = IF(@column_exists > 0,
    'ALTER TABLE mundoletras_scores ADD CONSTRAINT mundoletras_scores_fk1 FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE',
    'SELECT "No se pudo agregar FK para scores - columna no existe" as Warning'
);

SET @sql_boosters = IF(@column_exists > 0,
    'ALTER TABLE mundoletras_boosters ADD CONSTRAINT mundoletras_boosters_fk1 FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE',
    'SELECT "No se pudo agregar FK para boosters - columna no existe" as Warning'
);

-- Ejecutar las consultas
PREPARE stmt_progreso FROM @sql_progreso;
EXECUTE stmt_progreso;
DEALLOCATE PREPARE stmt_progreso;

PREPARE stmt_scores FROM @sql_scores;
EXECUTE stmt_scores;
DEALLOCATE PREPARE stmt_scores;

PREPARE stmt_boosters FROM @sql_boosters;
EXECUTE stmt_boosters;
DEALLOCATE PREPARE stmt_boosters;

-- ============================================
-- 5. DATOS INICIALES
-- ============================================

SELECT 'Insertando datos iniciales...' as Status;

-- Insertar temas iniciales
INSERT IGNORE INTO mundoletras_temas (codigo, nombre, descripcion, emoji, color, idioma) VALUES
('oceano', 'Océano', 'Palabras relacionadas con el mar y la vida marina', '🌊', '#1e40af', 'es'),
('bosque', 'Bosque', 'Palabras de la naturaleza y el bosque', '🌲', '#16a34a', 'es'),
('ciudad', 'Ciudad', 'Palabras del entorno urbano', '🏙️', '#dc2626', 'es'),
('espacio', 'Espacio', 'Palabras del cosmos y astronomía', '🚀', '#7c3aed', 'es'),
('animales', 'Animales', 'Diferentes especies del reino animal', '🦁', '#ea580c', 'es');

-- Insertar algunos niveles de ejemplo
INSERT IGNORE INTO mundoletras_niveles (nivel_numero, tema_id, seed, config_json) VALUES
(1, 1, 'oce-1-a1', JSON_OBJECT(
    'grid', JSON_OBJECT('rows', 6, 'cols', 6, 'diagonales', false, 'reversas', false),
    'palabras', JSON_ARRAY('MAR', 'ALGA', 'CORAL', 'PECES'),
    'modificadores', JSON_ARRAY(),
    'tiempoSeg', NULL,
    'erroresMax', 10,
    'vidas', 1,
    'recompensas', JSON_OBJECT('monedas', 10)
)),
(2, 1, 'oce-2-b3', JSON_OBJECT(
    'grid', JSON_OBJECT('rows', 6, 'cols', 6, 'diagonales', false, 'reversas', true),
    'palabras', JSON_ARRAY('DELFIN', 'BALLENA', 'ANCLA', 'FARO'),
    'modificadores', JSON_ARRAY('señuelos'),
    'tiempoSeg', NULL,
    'erroresMax', 10,
    'vidas', 1,
    'recompensas', JSON_OBJECT('monedas', 12)
));

-- ============================================
-- 6. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

SELECT 'Creando índices adicionales...' as Status;

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_scores_user_nivel ON mundoletras_scores(usuario_aplicacion_key, nivel_id);
CREATE INDEX IF NOT EXISTS idx_scores_nivel_score ON mundoletras_scores(nivel_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_fecha_score ON mundoletras_scores(fecha DESC, score DESC);

-- ============================================
-- 7. VERIFICACIONES FINALES
-- ============================================

SELECT 'Verificando instalación...' as Status;

-- Reactivar foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Mostrar información de las tablas creadas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_ROWS as 'Filas',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Tamaño (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = '9606966_sistema_apps_db' 
AND TABLE_NAME LIKE 'mundoletras_%'
ORDER BY TABLE_NAME;

-- Verificar que la aplicación esté registrada
SELECT 'Aplicación registrada:' as Info;
SELECT app_codigo, app_nombre, app_descripcion, activa 
FROM aplicaciones 
WHERE app_codigo = 'mundoletras';

-- Mostrar temas disponibles
SELECT 'Temas disponibles:' as Info;
SELECT tema_id, codigo, nombre, emoji, color 
FROM mundoletras_temas 
WHERE activo = 1;

SELECT '¡Instalación de Mundo Letras completada!' as Status;

COMMIT;
