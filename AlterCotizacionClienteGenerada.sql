-- ============================================================================
-- Migración: vincular la cotización cliente con la interna de la que se generó
-- y guardar el porcentaje de utilidad aplicado.
-- Ejecutar una sola vez sobre una BD ya existente. Es idempotente.
-- ============================================================================
USE constructora;
GO

-- De qué cotización interna se generó esta cotización cliente (NULL si fue manual)
IF COL_LENGTH('dbo.cotizacioncliente', 'idCotizacionInterna') IS NULL
    ALTER TABLE dbo.cotizacioncliente ADD idCotizacionInterna INT NULL;
GO

-- Porcentaje de utilidad aplicado al generar (NULL si fue creada a mano)
IF COL_LENGTH('dbo.cotizacioncliente', 'porcentajeUtilidad') IS NULL
    ALTER TABLE dbo.cotizacioncliente ADD porcentajeUtilidad DECIMAL(6,2) NULL;
GO

-- FK hacia la cotización interna de origen
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cotcli_cotinterna')
    ALTER TABLE dbo.cotizacioncliente
        ADD CONSTRAINT FK_cotcli_cotinterna FOREIGN KEY (idCotizacionInterna)
            REFERENCES dbo.cotizacioninterna (idCotizacionInterna);
GO
