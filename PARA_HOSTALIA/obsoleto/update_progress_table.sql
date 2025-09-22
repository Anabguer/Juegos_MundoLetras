-- Actualizar tabla de progreso para incluir puntuación total
ALTER TABLE mundoletras_progreso 
ADD COLUMN puntuacion_total INT NOT NULL DEFAULT 0 AFTER monedas;

-- Agregar índice para mejor rendimiento
ALTER TABLE mundoletras_progreso 
ADD INDEX idx_puntuacion_total (puntuacion_total);
