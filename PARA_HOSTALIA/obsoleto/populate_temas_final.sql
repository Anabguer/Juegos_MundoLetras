-- Poblar tabla mundoletras_temas
INSERT INTO mundoletras_temas (tema_id, codigo, nombre, descripcion, color, icono, activo) VALUES
(1, 'mundoletras', 'Básico', 'Palabras simples para empezar', '#4CAF50', 'leaf', 1),
(2, 'mundoletras', 'Océano', 'Palabras relacionadas con el mar', '#2196F3', 'wave', 1),
(3, 'mundoletras', 'Bosque', 'Palabras de la naturaleza', '#8BC34A', 'tree', 1),
(4, 'mundoletras', 'Montaña', 'Palabras de aventura y altura', '#FF9800', 'mountain', 1),
(5, 'mundoletras', 'Espacio', 'Palabras del universo', '#9C27B0', 'rocket', 1),
(6, 'mundoletras', 'Aventura', 'Palabras de exploración', '#F44336', 'compass', 1)
ON DUPLICATE KEY UPDATE
codigo = VALUES(codigo),
nombre = VALUES(nombre),
descripcion = VALUES(descripcion),
color = VALUES(color),
icono = VALUES(icono),
activo = VALUES(activo);