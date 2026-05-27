USE constructora;
GO

------------------------------------------------------------------------
-- 1) Version de SQL Server (necesito el numero de version / edicion)
------------------------------------------------------------------------
SELECT
    SERVERPROPERTY('ProductVersion') AS version,
    SERVERPROPERTY('ProductMajorVersion') AS versionMayor,  -- 13=2016, 14=2017, 15=2019, 16=2022
    SERVERPROPERTY('Edition')         AS edicion;
GO

------------------------------------------------------------------------
-- 2) ¿Esta realmente apagado el cache de IDENTITY?  (value debe ser 0)
--    Si esta consulta da error, tu version NO soporta IDENTITY_CACHE
--    (eres 2016 o anterior) y hay que usar el trace flag 272.
------------------------------------------------------------------------
SELECT name, value, value_for_secondary
FROM sys.database_scoped_configurations
WHERE name = 'IDENTITY_CACHE';
GO

------------------------------------------------------------------------
-- 3) Limpieza: borrar los clientes de prueba (id > 20) y volver a 20
--    -> el proximo cliente sera 21 de nuevo
------------------------------------------------------------------------
DELETE FROM dbo.cliente WHERE idCliente > 20;
GO
DBCC CHECKIDENT ('dbo.cliente', RESEED, 20);
GO

------------------------------------------------------------------------
-- 4) Reintentar apagar el cache (por si la primera vez no quedo)
------------------------------------------------------------------------
ALTER DATABASE SCOPED CONFIGURATION SET IDENTITY_CACHE = OFF;
GO

PRINT 'Diagnostico listo. Pega el resultado de las consultas 1 y 2.';
GO
