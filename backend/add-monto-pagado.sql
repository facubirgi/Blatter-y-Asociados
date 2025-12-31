-- Agregar columna monto_pagado a la tabla operaciones
ALTER TABLE operaciones
ADD COLUMN monto_pagado DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM information_schema.columns
WHERE TABLE_NAME = 'operaciones'
AND COLUMN_NAME = 'monto_pagado';
