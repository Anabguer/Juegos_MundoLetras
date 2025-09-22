-- Verificar y agregar columnas faltantes a mundoletras_temas
ALTER TABLE mundoletras_temas 
ADD COLUMN IF NOT EXISTS descripcion VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#4CAF50',
ADD COLUMN IF NOT EXISTS icono VARCHAR(10) DEFAULT '🌱',
ADD COLUMN IF NOT EXISTS activo TINYINT(1) DEFAULT 1;

-- Poblar tabla de temas
INSERT INTO mundoletras_temas (tema_id, nombre, descripcion, color, icono, activo) VALUES
(1, 'Básico', 'Palabras simples para empezar', '#4CAF50', '🌱', 1),
(2, 'Océano', 'Palabras relacionadas con el mar', '#2196F3', '🌊', 1),
(3, 'Bosque', 'Palabras de la naturaleza', '#8BC34A', '🌲', 1),
(4, 'Montaña', 'Palabras de aventura y altura', '#FF9800', '⛰️', 1),
(5, 'Espacio', 'Palabras del universo', '#9C27B0', '🚀', 1),
(6, 'Aventura', 'Palabras de exploración', '#F44336', '🗺️', 1)
ON DUPLICATE KEY UPDATE
nombre = VALUES(nombre),
descripcion = VALUES(descripcion),
color = VALUES(color),
icono = VALUES(icono),
activo = VALUES(activo);
