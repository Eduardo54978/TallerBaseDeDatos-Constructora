-- ============================================================================
-- Migración: guardar el pago por hora que el usuario define en cada línea de
-- mano de obra de una cotización interna. El pagoPorHora del cargo queda como
-- sugerencia/fallback (para líneas viejas que se cargaron sin este dato).
-- Ejecutar una sola vez sobre una BD ya existente. Es idempotente.
-- ============================================================================
USE constructora;
GO

-- Pago por hora elegido por el usuario para esta línea (NULL = usar el del cargo)
IF COL_LENGTH('dbo.detallecotizacionmanoobra', 'pagoPorHora') IS NULL
    ALTER TABLE dbo.detallecotizacionmanoobra ADD pagoPorHora DECIMAL(10,2) NULL;
GO

-- Backfill: las líneas existentes heredan la tarifa de su cargo para no cambiar
-- los totales ya calculados.
UPDATE d
   SET d.pagoPorHora = c.pagoPorHora
  FROM dbo.detallecotizacionmanoobra d
  JOIN dbo.cargo c ON d.idCargo = c.idCargo
 WHERE d.pagoPorHora IS NULL;
GO
