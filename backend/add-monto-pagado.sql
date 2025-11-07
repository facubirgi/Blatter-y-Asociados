-- Agregar columna monto_pagado a la tabla operaciones
ALTER TABLE operaciones
ADD COLUMN monto_pagado DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'operaciones'
AND column_name = 'monto_pagado';
