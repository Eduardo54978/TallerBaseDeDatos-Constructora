-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: asociar una orden de compra con la cotización interna en la que se
-- basa. Permite la "doble verificación": la orden se crea en Nueva Orden basada
-- en una cotización interna, y luego en Agregar Detalle se confirma/registra el
-- detalle desde esa misma cotización (sin perder la referencia).
-- Idempotente: se puede ejecutar varias veces.
-- ─────────────────────────────────────────────────────────────────────────────
USE constructora;
GO

IF COL_LENGTH('dbo.ordencompra', 'idCotizacionInterna') IS NULL
    ALTER TABLE dbo.ordencompra ADD idCotizacionInterna INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ordencompra_cotizacioninterna')
    ALTER TABLE dbo.ordencompra
        ADD CONSTRAINT FK_ordencompra_cotizacioninterna
        FOREIGN KEY (idCotizacionInterna)
        REFERENCES dbo.cotizacioninterna (idCotizacionInterna);
GO
