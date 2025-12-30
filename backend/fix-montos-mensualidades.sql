-- Script para corregir los montos de las operaciones de mensualidad que tienen monto 0
-- y deberían tener el monto de mensualidad del cliente

-- Primero, verificar cuántas operaciones tienen este problema
SELECT 
    o.id,
    o.descripcion,
    o.monto as monto_actual,
    c.nombre as cliente_nombre,
    c.monto_mensualidad as monto_deberia_ser,
    o.created_at
FROM operaciones o
JOIN clientes c ON o.cliente_id = c.id
WHERE o.es_mensualidad = true 
  AND o.monto = 0 
  AND c.monto_mensualidad > 0
ORDER BY o.created_at DESC;

-- Actualizar los montos de las operaciones de mensualidad con monto 0
UPDATE operaciones o
SET monto = c.monto_mensualidad
FROM clientes c
WHERE o.cliente_id = c.id
  AND o.es_mensualidad = true
  AND o.monto = 0
  AND c.monto_mensualidad > 0;

-- Verificar que se actualizaron correctamente
SELECT 
    o.id,
    o.descripcion,
    o.monto as monto_actualizado,
    c.nombre as cliente_nombre,
    c.monto_mensualidad,
    o.updated_at
FROM operaciones o
JOIN clientes c ON o.cliente_id = c.id
WHERE o.es_mensualidad = true
ORDER BY o.updated_at DESC
LIMIT 20;
