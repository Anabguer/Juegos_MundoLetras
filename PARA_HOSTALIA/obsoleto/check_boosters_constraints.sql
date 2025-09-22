-- Verificar restricciones de mundoletras_boosters
SHOW CREATE TABLE mundoletras_boosters;

-- Verificar índices
SHOW INDEX FROM mundoletras_boosters;

-- Verificar claves foráneas
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'mundoletras_boosters' 
AND TABLE_SCHEMA = DATABASE();
