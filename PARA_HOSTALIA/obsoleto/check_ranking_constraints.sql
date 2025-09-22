-- Verificar restricciones de mundoletras_ranking_cache
SHOW CREATE TABLE mundoletras_ranking_cache;

-- Verificar índices
SHOW INDEX FROM mundoletras_ranking_cache;

-- Verificar claves foráneas
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'mundoletras_ranking_cache' 
AND TABLE_SCHEMA = DATABASE();
