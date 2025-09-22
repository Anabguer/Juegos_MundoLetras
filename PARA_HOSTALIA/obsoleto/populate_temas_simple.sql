-- Poblar tabla de temas (versión simple)
INSERT INTO mundoletras_temas (tema_id, nombre) VALUES
(1, 'Básico'),
(2, 'Océano'),
(3, 'Bosque'),
(4, 'Montaña'),
(5, 'Espacio'),
(6, 'Aventura')
ON DUPLICATE KEY UPDATE
nombre = VALUES(nombre);
