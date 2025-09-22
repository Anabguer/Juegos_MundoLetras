-- Versión segura para poblar temas
-- Primero verificar si las columnas existen y agregarlas si es necesario

-- Agregar descripcion si no existe
ALTER TABLE mundoletras_temas ADD COLUMN descripcion VARCHAR(255) DEFAULT '';

-- Agregar color si no existe  
ALTER TABLE mundoletras_temas ADD COLUMN color VARCHAR(7) DEFAULT '#4CAF50';

-- Agregar icono si no existe
ALTER TABLE mundoletras_temas ADD COLUMN icono VARCHAR(10) DEFAULT 'leaf';

-- Agregar activo si no existe
ALTER TABLE mundoletras_temas ADD COLUMN activo TINYINT(1) DEFAULT 1;

-- Poblar datos
INSERT INTO mundoletras_temas (tema_id, nombre, descripcion, color, icono, activo) VALUES
(1, 'Básico', 'Palabras simples para empezar', '#4CAF50', 'leaf', 1),
(2, 'Océano', 'Palabras relacionadas con el mar', '#2196F3', 'wave', 1),
(3, 'Bosque', 'Palabras de la naturaleza', '#8BC34A', 'tree', 1),
(4, 'Montaña', 'Palabras de aventura y altura', '#FF9800', 'mountain', 1),
(5, 'Espacio', 'Palabras del universo', '#9C27B0', 'rocket', 1),
(6, 'Aventura', 'Palabras de exploración', '#F44336', 'compass', 1)
ON DUPLICATE KEY UPDATE
nombre = VALUES(nombre),
descripcion = VALUES(descripcion),
color = VALUES(color),
icono = VALUES(icono),
activo = VALUES(activo);
