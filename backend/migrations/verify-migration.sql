-- ============================================================================
-- SCRIPT DE VERIFICACIÓN POST-MIGRACIÓN
-- Fecha: 2025-12-30
-- Descripción: Verificar que la migración de datos se completó correctamente
-- ============================================================================

-- 1. Verificar que todos los registros tienen monto poblado
SELECT
    COUNT(*) as total_operaciones,
    COUNT(monto) as operaciones_con_monto,
    SUM(CASE WHEN monto IS NULL THEN 1 ELSE 0 END) as operaciones_sin_monto,
    SUM(CASE WHEN monto = 0 THEN 1 ELSE 0 END) as operaciones_con_monto_cero
FROM operaciones;

-- 2. Comparar sumas totales antes/después (deben ser iguales)
SELECT
    SUM(ingresos_brutos) as suma_ingresos_brutos_original,
    SUM(monto) as suma_monto_nuevo,
    SUM(monto_pagado) as suma_pagado_total,
    SUM(ingresos_brutos) - SUM(monto) as diferencia
FROM operaciones;

-- 3. Verificar integridad por estado
SELECT
    estado,
    COUNT(*) as cantidad,
    SUM(monto) as monto_total,
    SUM(monto_pagado) as pagado_total,
    SUM(monto - monto_pagado) as pendiente_total
FROM operaciones
GROUP BY estado
ORDER BY estado;

-- 4. Verificar operaciones con datos inconsistentes (si los hay)
SELECT
    id,
    cliente_id,
    estado,
    ingresos_brutos,
    monto,
    honorarios,
    monto_total,
    monto_pagado
FROM operaciones
WHERE monto IS NULL OR monto = 0 OR monto != ingresos_brutos
LIMIT 20;

-- ============================================================================
-- RESULTADOS ESPERADOS:
-- ============================================================================
-- Query 1: operaciones_sin_monto debe ser 0
-- Query 2: diferencia debe ser 0
-- Query 3: Debe mostrar distribución correcta por estado
-- Query 4: NO debe retornar filas (todos los registros deben ser consistentes)
-- ============================================================================
