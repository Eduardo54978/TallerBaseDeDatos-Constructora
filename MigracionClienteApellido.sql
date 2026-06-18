-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: normalizar dbo.cliente separando nombre y apellido.
-- Antes la tabla guardaba el "nombre completo" en una sola columna (error de
-- normalización). Se agrega la columna apellido y se migran los datos existentes:
--   · Persona Natural → primer token = nombre, resto = apellido.
--   · Empresas y otros tipos → el nombre queda intacto y apellido = '' (no aplica).
-- Idempotente: se puede ejecutar varias veces sin duplicar el efecto.
-- ─────────────────────────────────────────────────────────────────────────────
USE constructora;
GO

IF COL_LENGTH('dbo.cliente', 'apellido') IS NULL
    ALTER TABLE dbo.cliente ADD apellido NVARCHAR(100) NULL;
GO

-- Personas naturales: separar el primer token del resto.
-- El " + ' '" garantiza que CHARINDEX siempre encuentre un espacio (nombres de
-- una sola palabra quedan con apellido vacío).
UPDATE c SET
    apellido = LTRIM(SUBSTRING(LTRIM(RTRIM(c.nombre)),
                     CHARINDEX(' ', LTRIM(RTRIM(c.nombre)) + ' ') + 1, 200)),
    nombre   = LEFT(LTRIM(RTRIM(c.nombre)),
                    CHARINDEX(' ', LTRIM(RTRIM(c.nombre)) + ' ') - 1)
FROM dbo.cliente c
JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
WHERE tc.nombreTipoCliente = 'Persona Natural'
  AND c.apellido IS NULL;
GO

-- Resto de clientes (empresas, etc.): apellido vacío, nombre sin cambios.
UPDATE dbo.cliente SET apellido = '' WHERE apellido IS NULL;
GO

-- Asegurar que la columna sea obligatoria de aquí en adelante.
ALTER TABLE dbo.cliente ALTER COLUMN apellido NVARCHAR(100) NOT NULL;
GO
