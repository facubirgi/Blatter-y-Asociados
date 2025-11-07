-- Migración manual para hacer nullable los campos descripcion y fecha_limite
-- Ejecuta este script en tu base de datos PostgreSQL

-- Hacer nullable el campo descripcion
ALTER TABLE operaciones
ALTER COLUMN descripcion DROP NOT NULL;

-- Hacer nullable el campo fecha_limite
ALTER TABLE operaciones
ALTER COLUMN fecha_limite DROP NOT NULL;

-- Verificar los cambios
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'operaciones'
AND column_name IN ('descripcion', 'fecha_limite');
