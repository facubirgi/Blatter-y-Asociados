-- Migración manual para hacer nullable los campos descripcion y fecha_limite
-- Ejecuta este script en tu base de datos MySQL

-- Hacer nullable el campo descripcion
ALTER TABLE operaciones
MODIFY COLUMN descripcion TEXT NULL;

-- Hacer nullable el campo fecha_limite
ALTER TABLE operaciones
MODIFY COLUMN fecha_limite DATE NULL;

-- Verificar los cambios
SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE
FROM information_schema.columns
WHERE table_name = 'operaciones'
AND COLUMN_NAME IN ('descripcion', 'fecha_limite');
