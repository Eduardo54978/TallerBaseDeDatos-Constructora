USE constructora;
GO
-- PERMISOS A ROLES PARA EJECUTAR TRIGGERS

GRANT INSERT, UPDATE ON detallecompra TO rol_logistica;
GRANT INSERT, UPDATE ON materialproyecto TO rol_jefe_obra;
GRANT INSERT, UPDATE ON registrohoras TO rol_jefe_obra;
GRANT INSERT, UPDATE ON ordencompra TO rol_logistica;
GO
-- TRIGGER 1: Al comprar materiales ? sumar al inventario
CREATE OR ALTER TRIGGER trg_actualizar_inventario_compra
ON detallecompra
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inv
    SET 
        inv.stockActual = inv.stockActual + i.cantidad,
        inv.fechaActualizacion = CAST(GETDATE() AS DATE)
    FROM inventario inv
    INNER JOIN inserted i ON inv.idMaterial = i.idMaterial;
    PRINT 'Inventario actualizado correctamente tras la compra.';
END;
GO
-- PRUEBA TRIGGER 1
INSERT INTO ordencompra (fechaOrden, idEstadoOrden, idProveedor, montoTotal)
VALUES (GETDATE(), 1, 1, 5800.00);

INSERT INTO detallecompra (idOrdenCompra, idMaterial, cantidad, precioUnitario)
VALUES (11, 1, 50.00, 58.00);
-- Verificar que subio el stock del material 1
SELECT idMaterial, stockActual, fechaActualizacion 
FROM inventario 
WHERE idMaterial = 1;
GO
-- TRIGGER 2: Al usar material en proyecto ? restar del inventario
CREATE OR ALTER TRIGGER trg_descontar_inventario_proyecto
ON materialproyecto
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    -- Verificar si hay stock suficiente
    IF EXISTS (
        SELECT 1
        FROM inventario inv
        INNER JOIN inserted i ON inv.idMaterial = i.idMaterial
        WHERE inv.stockActual < i.cantidadUtilizada
    )
    BEGIN
        THROW 60001, 
        'ERROR: Stock insuficiente para cubrir la cantidad utilizada en el proyecto.', 
        1;
    END
    -- Descontar del inventario
    UPDATE inv
    SET 
        inv.stockActual = inv.stockActual - i.cantidadUtilizada,
        inv.fechaActualizacion = CAST(GETDATE() AS DATE)
    FROM inventario inv
    INNER JOIN inserted i ON inv.idMaterial = i.idMaterial;
    IF EXISTS (
        SELECT 1
        FROM inventario inv
        INNER JOIN inserted i ON inv.idMaterial = i.idMaterial
        WHERE inv.stockActual < inv.stockMinimo
    )
    BEGIN
        PRINT 'ADVERTENCIA: El stock de uno o más materiales bajó del mínimo recomendado.';
    END
    PRINT 'Stock descontado correctamente del inventario.';
END;
GO

-- PRUEBA TRIGGER 2
INSERT INTO materialproyecto (idProyecto, idMaterial, cantidadUtilizada, fechaRegistro, costoTotal)
VALUES (1, 1, 30.00, GETDATE(), 1740.00);

-- Verificar que bajo el stock del material 1
SELECT idMaterial, stockActual, stockMinimo, fechaActualizacion 
FROM inventario 
WHERE idMaterial = 1;
GO

-- TRIGGER 3: Stock bajo del minimo ? alerta automatica
USE constructora;
GO
IF OBJECT_ID('dbo.alertas_inventario', 'U') IS NULL
CREATE TABLE dbo.alertas_inventario (
    idAlerta      INT IDENTITY(1,1) PRIMARY KEY,
    idMaterial    INT NOT NULL,
    stockActual   DECIMAL(10,2) NOT NULL,
    stockMinimo   DECIMAL(10,2) NOT NULL,
    fechaAlerta   DATETIME NOT NULL DEFAULT GETDATE(),
    mensaje       NVARCHAR(255) NOT NULL
);
GO
-- TRIGGER 3: Stock bajo del minimo ? alerta automatica
CREATE OR ALTER TRIGGER trg_alerta_stock_minimo
ON inventario
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO alertas_inventario (idMaterial, stockActual, stockMinimo, fechaAlerta, mensaje)
    SELECT 
        i.idMaterial,
        i.stockActual,
        i.stockMinimo,
        GETDATE(),
        N'ALERTA: Stock del material ' + CAST(i.idMaterial AS NVARCHAR) + 
        N' bajó del mínimo. Stock actual: ' + CAST(i.stockActual AS NVARCHAR) +
        N' | Mínimo requerido: ' + CAST(i.stockMinimo AS NVARCHAR)
    FROM inserted i
    WHERE i.stockActual < i.stockMinimo;
    IF @@ROWCOUNT > 0
        PRINT 'ALERTA REGISTRADA: Materiales por debajo del stock mínimo.';
END;
GO

UPDATE inventario
SET stockActual = 10.00
WHERE idMaterial = 6;

SELECT * FROM alertas_inventario;
GO
-- TRIGGER 4: Al cancelar orden de compra ? revertir inventario
CREATE OR ALTER TRIGGER trg_revertir_inventario_orden_cancelada
ON ordencompra
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Solo actuar si el estado cambio a Cancelada (idEstadoOrden = 3)
    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.idOrdenCompra = d.idOrdenCompra
        WHERE i.idEstadoOrden = 3 AND d.idEstadoOrden != 3
    )
    BEGIN
        -- Restar del inventario lo que se habia sumado
        UPDATE inv
        SET 
            inv.stockActual = inv.stockActual - dc.cantidad,
            inv.fechaActualizacion = CAST(GETDATE() AS DATE)
        FROM inventario inv
        INNER JOIN detallecompra dc ON inv.idMaterial = dc.idMaterial
        INNER JOIN inserted i ON dc.idOrdenCompra = i.idOrdenCompra
        INNER JOIN deleted d ON i.idOrdenCompra = d.idOrdenCompra
        WHERE i.idEstadoOrden = 3 AND d.idEstadoOrden != 3;
        PRINT 'Inventario revertido correctamente por cancelacion de orden.';
    END
END;
GO
-- Cancelar la orden 11 que insertamos en la prueba del trigger 1
UPDATE ordencompra
SET idEstadoOrden = 3
WHERE idOrdenCompra = 11;
-- Verificar que el stock volvio a su valor anterior
SELECT idMaterial, stockActual, fechaActualizacion
FROM inventario
WHERE idMaterial = 1;
GO
-- VERIFICACION FINAL DE TODO EL INVENTARIO
SELECT 
    m.nombreMaterial,
    inv.stockActual,
    inv.stockMinimo,
    CASE 
        WHEN inv.stockActual < inv.stockMinimo 
        THEN 'STOCK BAJO' 
        ELSE 'OK' 
    END AS estado,
    inv.fechaActualizacion
FROM inventario inv
INNER JOIN material m ON inv.idMaterial = m.idMaterial
ORDER BY inv.idMaterial;
GO


-- Reinvertir
USE constructora;
GO

-- Revertir stock del material 1 (subio por trigger 1 y bajo por trigger 2 y 4)
UPDATE inventario SET stockActual = 500.00 WHERE idMaterial = 1;

-- Revertir stock del material 6 (bajo por prueba trigger 3)
UPDATE inventario SET stockActual = 300.00 WHERE idMaterial = 6;

-- Limpiar alertas generadas
DELETE FROM alertas_inventario;

-- Eliminar orden de prueba 22 (la que insertamos)
DELETE FROM detallecompra WHERE idOrdenCompra = 22;
DELETE FROM ordencompra WHERE idOrdenCompra = 22;

-- Eliminar materialproyecto de prueba
DELETE FROM materialproyecto WHERE idProyecto = 1 AND idMaterial = 1 AND costoTotal = 1740.00;
GO

-- Verificar que quedó bien
SELECT idMaterial, stockActual, stockMinimo FROM inventario WHERE idMaterial IN (1,6);
GO