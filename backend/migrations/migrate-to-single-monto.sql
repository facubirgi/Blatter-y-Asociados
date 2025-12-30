-- ============================================================================
-- MIGRACIÓN: Consolidar ingresosBrutos en campo monto
-- Fecha: 2025-12-30
-- Descripción: Migrar de estructura multi-campo (ingresosBrutos, honorarios,
--              montoTotal) a campo único (monto)
-- ============================================================================

BEGIN;

-- 1. Actualizar campo monto con valores de ingresosBrutos
-- Esto preserva todos los datos existentes
UPDATE operaciones
SET monto = ingresos_brutos
WHERE monto IS NULL OR monto = 0;

-- 2. Verificar que todos los registros tienen monto poblado
-- Debe retornar 0 para proceder con seguridad
SELECT COUNT(*) as registros_sin_monto
FROM operaciones
WHERE monto IS NULL OR monto = 0;

-- 3. Muestra de datos migrados (primeros 10 registros)
SELECT
    id,
    cliente_id,
    ingresos_brutos as monto_original,
    monto as monto_migrado,
    honorarios,
    monto_total,
    monto_pagado
FROM operaciones
LIMIT 10;

-- 4. Estadísticas de verificación
SELECT
    COUNT(*) as total_operaciones,
    SUM(ingresos_brutos) as suma_ingresos_brutos,
    SUM(monto) as suma_monto_nuevo,
    SUM(monto_pagado) as suma_pagado
FROM operaciones;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script solo MIGRA datos, NO elimina columnas
-- 2. Las columnas ingresos_brutos, honorarios y monto_total serán eliminadas
--    automáticamente por TypeORM cuando se reinicie el servidor backend
-- 3. TypeORM detectará que esas columnas ya no están en la entity y las
--    eliminará del schema (si synchronize=true está activo)
-- 4. Ejecutar ANTES de hacer cambios en el código
-- ============================================================================
