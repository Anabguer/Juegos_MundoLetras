-- Crear tabla mundoletras_niveles de forma segura
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS mundoletras_niveles;

CREATE TABLE mundoletras_niveles (
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

-- Agregar claves foráneas después de crear la tabla
ALTER TABLE mundoletras_niveles 
ADD CONSTRAINT mundoletras_niveles_fk1 
FOREIGN KEY (usuario_aplicacion_key) REFERENCES usuarios_aplicaciones (usuario_aplicacion_key) ON DELETE CASCADE;

ALTER TABLE mundoletras_niveles 
ADD CONSTRAINT mundoletras_niveles_fk2 
FOREIGN KEY (tema_id) REFERENCES mundoletras_temas (tema_id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
