USE constructora;
GO

/*
    FIX: los IDs nuevos saltan a 2021, 2022, ... en vez de 21, 22.

    CAUSA (no es bug de la app):
      SQL Server cachea rangos de IDENTITY de 1000 en 1000 para columnas INT.
      Cuando el servicio de SQL Server se reinicia de forma inesperada (apagar la
      PC, cerrar el contenedor, caida del servicio), pierde el rango cacheado y la
      proxima identidad SALTA +1000. La semilla iba en 20 (clientes precargados
      1..20); tras un par de reinicios salto a ~2020 y el proximo cliente salio 2021.
      Afecta por igual a TODAS las tablas con IDENTITY(1,1).

    Este script:
      PASO 1 - Apaga el cache de IDENTITY para que NO vuelva a saltar (la cura real).
      PASO 2 - Borra los clientes de prueba con id alto y reinicia su semilla a 20.
      PASO 3 - Reinicia la semilla de TODAS las tablas con IDENTITY al MAX real,
               para que el proximo id sea contiguo y sin huecos.
      PASO 4 - Verificacion.

    Es idempotente: se puede correr varias veces sin dano.
*/

------------------------------------------------------------------------
-- PASO 1: evitar futuros saltos (SQL Server 2017+)
------------------------------------------------------------------------
ALTER DATABASE SCOPED CONFIGURATION SET IDENTITY_CACHE = OFF;
GO
-- Si tu version es anterior a SQL Server 2017, comenta la linea de arriba
-- y en su lugar arranca el servicio con el trace flag global 272:
--   DBCC TRACEON (272, -1);
-- (o agregalo como parametro de inicio -T272 en SQL Server Configuration Manager).

------------------------------------------------------------------------
-- PASO 2: limpiar clientes de prueba (id > 20) y reiniciar semilla a 20
--         (los precargados van del 1 al 20; el proximo real debe ser 21)
------------------------------------------------------------------------
-- Nota: si algun cliente de prueba tiene proyectos/contratos asociados, el DELETE
-- fallara por FK; en ese caso borra primero esos registros dependientes.
DELETE FROM dbo.cliente WHERE idCliente > 20;
GO
DBCC CHECKIDENT ('dbo.cliente', RESEED, 20);
GO

------------------------------------------------------------------------
-- PASO 3: reiniciar la semilla de TODAS las tablas con IDENTITY al MAX real
--         (solo tablas con filas; las vacias se dejan intactas)
------------------------------------------------------------------------
DECLARE @schema SYSNAME, @table SYSNAME, @col SYSNAME, @max BIGINT, @sql NVARCHAR(MAX);

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT s.name, t.name, c.name
    FROM sys.identity_columns c
    JOIN sys.tables  t ON t.object_id = c.object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id;

OPEN cur;
FETCH NEXT FROM cur INTO @schema, @table, @col;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @max = NULL;
    SET @sql = N'SELECT @m = MAX(' + QUOTENAME(@col) + N') FROM '
             + QUOTENAME(@schema) + N'.' + QUOTENAME(@table);
    EXEC sp_executesql @sql, N'@m BIGINT OUTPUT', @m = @max OUTPUT;

    -- Solo reseteamos tablas que tienen datos (con filas, el proximo id = MAX + 1).
    IF @max IS NOT NULL
    BEGIN
        SET @sql = N'DBCC CHECKIDENT (''' + @schema + N'.' + @table
                 + N''', RESEED, ' + CAST(@max AS NVARCHAR(20)) + N')';
        EXEC (@sql);
    END

    FETCH NEXT FROM cur INTO @schema, @table, @col;
END
CLOSE cur;
DEALLOCATE cur;
GO

------------------------------------------------------------------------
-- PASO 4: verificacion — semilla actual vs. MAX por tabla con IDENTITY
------------------------------------------------------------------------
SELECT
    s.name AS esquema,
    t.name AS tabla,
    c.name AS columnaIdentidad,
    CAST(IDENT_CURRENT(s.name + '.' + t.name) AS BIGINT) AS semillaActual
FROM sys.identity_columns c
JOIN sys.tables  t ON t.object_id = c.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
ORDER BY t.name;
GO

PRINT 'Listo: cache de IDENTITY apagado y semillas reiniciadas. El proximo cliente sera 21.';
GO
