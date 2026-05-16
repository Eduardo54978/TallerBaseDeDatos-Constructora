USE constructora;
GO

IF DATABASE_PRINCIPAL_ID('rol_contador') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.pagocliente TO rol_contador;
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.pagoproveedor TO rol_contador;
    GRANT SELECT, UPDATE ON dbo.cuota TO rol_contador;
    GRANT SELECT ON dbo.ordencompra TO rol_contador;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_rrhh') IS NOT NULL
BEGIN
    GRANT SELECT, UPDATE ON dbo.empleado TO rol_rrhh;
    GRANT SELECT, UPDATE ON dbo.empleadoproyecto TO rol_rrhh;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_gerente') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE ON dbo.contrato TO rol_gerente;
    GRANT SELECT, UPDATE ON dbo.proyecto TO rol_gerente;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_secretaria') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE ON dbo.contrato TO rol_secretaria;
END;
GO


CREATE OR ALTER TRIGGER trg_validar_pago_proveedor_excedente
ON pagoproveedor
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.ordencompra oc ON i.idOrdenCompra = oc.idOrdenCompra
        CROSS APPLY (
            SELECT ISNULL(SUM(pp.monto), 0) as totalPagado
            FROM dbo.pagoproveedor pp
            WHERE pp.idOrdenCompra = i.idOrdenCompra
        ) as consulta
        WHERE consulta.totalPagado > oc.montoTotal
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('ERROR FINANCIERO: El pago excede el monto total pendiente de la Orden de Compra.', 16, 1);
        RETURN;
    END
END;
GO


CREATE OR ALTER TRIGGER trg_baja_automatica_empleadoproyecto
ON empleado
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(idEstadoEmpleado)
    BEGIN
        UPDATE ep
        SET ep.fechaFin = CAST(GETDATE() AS DATE)
        FROM empleadoproyecto ep
        INNER JOIN inserted i ON ep.idEmpleado = i.idEmpleado
        INNER JOIN deleted d ON i.idEmpleado = d.idEmpleado
        WHERE i.idEstadoEmpleado <> d.idEstadoEmpleado
          AND i.idEstadoEmpleado > 1
          AND ep.fechaFin IS NULL;
    END
    PRINT 'Asignaciones de proyectos actualizadas para empleados inactivos.';
END;
GO


CREATE OR ALTER TRIGGER trg_activar_proyecto_por_contrato
ON contrato
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
    SET p.idEstadoProyecto = 2
    FROM proyecto p
    INNER JOIN inserted i ON p.idProyecto = i.idProyecto
    WHERE i.fechaFirma IS NOT NULL
      AND i.idEstadoContrato = 1;
    PRINT 'Estado del proyecto actualizado a En Ejecucion tras la firma del contrato.';
END;
GO


CREATE OR ALTER TRIGGER trg_proteger_cotizacion_aprobada
ON detallecotizacioncliente
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM cotizacioncliente c
        INNER JOIN (
            SELECT idCotizacionCliente FROM inserted
            UNION
            SELECT idCotizacionCliente FROM deleted
        ) afectadas ON c.idCotizacionCliente = afectadas.idCotizacionCliente
        WHERE c.idEstadoCotizacion = 2
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(
            'ACCESO DENEGADO: No se pueden modificar, agregar ni eliminar detalles de una cotizacion que ya fue aprobada.',
            16,
            1
        );
        RETURN;
    END
END;
GO


USE constructora;
GO

IF DATABASE_PRINCIPAL_ID('rol_contador') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.pagocliente TO rol_contador;
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.cuota TO rol_contador;
    GRANT SELECT, UPDATE ON dbo.contrato TO rol_contador;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_jefe_obra') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE ON dbo.registrohoras TO rol_jefe_obra;
    GRANT SELECT ON dbo.empleadoproyecto TO rol_jefe_obra;
    GRANT SELECT, UPDATE ON dbo.proyecto TO rol_jefe_obra;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_gerente') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.contrato TO rol_gerente;
    GRANT SELECT, UPDATE ON dbo.proyecto TO rol_gerente;
    GRANT SELECT ON dbo.cuota TO rol_gerente;
END;
GO

IF DATABASE_PRINCIPAL_ID('rol_logistica') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.proveedor TO rol_logistica;
    GRANT SELECT, INSERT, UPDATE ON dbo.proveedormaterial TO rol_logistica;
    GRANT SELECT, INSERT ON dbo.detallecompra TO rol_logistica;
    GRANT SELECT ON dbo.ordencompra TO rol_logistica;
END;
GO


CREATE OR ALTER TRIGGER dbo.pagoClienteActualizarSaldoCuota
ON dbo.pagocliente
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.cuota c
            ON c.idCuota = i.idCuota
        WHERE i.idContrato <> c.idContrato
    )
    BEGIN
        THROW 51001, 'El contrato del pago no coincide con el contrato de la cuota.', 1;
    END;

    DECLARE @CuotasAfectadas TABLE (
        idCuota INT PRIMARY KEY
    );

    INSERT INTO @CuotasAfectadas (idCuota)
    SELECT idCuota
    FROM inserted
    WHERE idCuota IS NOT NULL
    UNION
    SELECT idCuota
    FROM deleted
    WHERE idCuota IS NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM @CuotasAfectadas ca
        INNER JOIN dbo.cuota c
            ON c.idCuota = ca.idCuota
        CROSS APPLY (
            SELECT ISNULL(SUM(pc.monto), 0) AS totalPagado
            FROM dbo.pagocliente pc
            WHERE pc.idCuota = ca.idCuota
              AND pc.idEstadoPago IN (2, 3)
        ) pagos
        WHERE pagos.totalPagado > c.montoCuota
    )
    BEGIN
        THROW 51002, 'El total pagado no puede superar el monto de la cuota.', 1;
    END;

    UPDATE c
    SET
        saldoPendiente =
            CASE
                WHEN c.montoCuota - pagos.totalPagado < 0 THEN 0
                ELSE c.montoCuota - pagos.totalPagado
            END,
        idEstadoPago =
            CASE
                WHEN pagos.totalPagado >= c.montoCuota THEN 3
                WHEN pagos.totalPagado > 0 THEN 2
                ELSE 1
            END
    FROM dbo.cuota c
    INNER JOIN @CuotasAfectadas ca
        ON ca.idCuota = c.idCuota
    CROSS APPLY (
        SELECT ISNULL(SUM(pc.monto), 0) AS totalPagado
        FROM dbo.pagocliente pc
        WHERE pc.idCuota = c.idCuota
          AND pc.idEstadoPago IN (2, 3)
    ) pagos;
END;
GO


CREATE OR ALTER TRIGGER dbo.cuotaValidarMontoContrato
ON dbo.cuota
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE saldoPendiente > montoCuota
    )
    BEGIN
        THROW 51003, 'El saldo pendiente no puede ser mayor al monto de la cuota.', 1;
    END;

    DECLARE @ContratosAfectados TABLE (
        idContrato INT PRIMARY KEY
    );

    INSERT INTO @ContratosAfectados (idContrato)
    SELECT idContrato
    FROM inserted
    WHERE idContrato IS NOT NULL
    UNION
    SELECT idContrato
    FROM deleted
    WHERE idContrato IS NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM @ContratosAfectados ca
        INNER JOIN dbo.contrato con
            ON con.idContrato = ca.idContrato
        CROSS APPLY (
            SELECT ISNULL(SUM(c.montoCuota), 0) AS totalCuotas
            FROM dbo.cuota c
            WHERE c.idContrato = ca.idContrato
        ) cuotas
        WHERE cuotas.totalCuotas > con.montoTotal
    )
    BEGIN
        THROW 51004, 'La suma de cuotas no puede superar el monto total del contrato.', 1;
    END;
END;
GO


CREATE OR ALTER TRIGGER dbo.registroHorasValidarJornadaEmpleado
ON dbo.registrohoras
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE horasTrabajadas <= 0
           OR horasTrabajadas > 8
    )
    BEGIN
        THROW 51005, 'Las horas trabajadas deben ser mayores a 0 y maximo 8 por registro.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE fecha > CAST(GETDATE() AS DATE)
    )
    BEGIN
        THROW 51006, 'No se pueden registrar horas con fecha futura.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN dbo.empleadoproyecto ep
            ON ep.idEmpleado = i.idEmpleado
           AND ep.idProyecto = i.idProyecto
           AND i.fecha >= ep.fechaInicio
           AND (
                ep.fechaFin IS NULL
                OR i.fecha <= ep.fechaFin
           )
        WHERE ep.idEmpleadoProyecto IS NULL
    )
    BEGIN
        THROW 51007, 'El empleado no esta asignado al proyecto en la fecha registrada.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.registrohoras rh
        INNER JOIN inserted i
            ON i.idEmpleado = rh.idEmpleado
           AND i.fecha = rh.fecha
        GROUP BY rh.idEmpleado, rh.fecha
        HAVING SUM(rh.horasTrabajadas) > 8
    )
    BEGIN
        THROW 51008, 'Un empleado no puede registrar mas de 8 horas trabajadas en un mismo dia.', 1;
    END;
END;
GO


IF OBJECT_ID('dbo.historialestadoproyecto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historialestadoproyecto (
        idHistorialEstadoProyecto INT IDENTITY(1,1) PRIMARY KEY,
        idProyecto INT NOT NULL,
        idEstadoAnterior INT NULL,
        nombreEstadoAnterior NVARCHAR(100) NULL,
        idEstadoNuevo INT NOT NULL,
        nombreEstadoNuevo NVARCHAR(100) NULL,
        fechaCambio DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        observacion NVARCHAR(255) NULL
    );
END;
GO


CREATE OR ALTER TRIGGER dbo.proyectoRegistrarCambioEstado
ON dbo.proyecto
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.historialestadoproyecto (
        idProyecto,
        idEstadoAnterior,
        nombreEstadoAnterior,
        idEstadoNuevo,
        nombreEstadoNuevo,
        fechaCambio,
        observacion
    )
    SELECT
        i.idProyecto,
        d.idEstadoProyecto,
        ea.nombreEstadoProyecto,
        i.idEstadoProyecto,
        en.nombreEstadoProyecto,
        SYSDATETIME(),
        N'Cambio automatico de estado del proyecto'
    FROM inserted i
    INNER JOIN deleted d
        ON d.idProyecto = i.idProyecto
    LEFT JOIN dbo.estadoproyecto ea
        ON ea.idEstadoProyecto = d.idEstadoProyecto
    LEFT JOIN dbo.estadoproyecto en
        ON en.idEstadoProyecto = i.idEstadoProyecto
    WHERE ISNULL(i.idEstadoProyecto, -1) <> ISNULL(d.idEstadoProyecto, -1);

    UPDATE p
    SET fechaFinReal = CAST(GETDATE() AS DATE)
    FROM dbo.proyecto p
    INNER JOIN inserted i
        ON i.idProyecto = p.idProyecto
    INNER JOIN deleted d
        ON d.idProyecto = i.idProyecto
    WHERE ISNULL(i.idEstadoProyecto, -1) <> ISNULL(d.idEstadoProyecto, -1)
      AND i.idEstadoProyecto = 3
      AND p.fechaFinReal IS NULL;
END;
GO


CREATE OR ALTER TRIGGER dbo.trg_cancelar_cuotas_contrato_rescindido
ON dbo.contrato
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d
            ON i.idContrato = d.idContrato
        WHERE i.idEstadoContrato = 3
          AND d.idEstadoContrato <> 3
    )
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM dbo.pagocliente pc
            INNER JOIN dbo.cuota c
                ON pc.idCuota = c.idCuota
            INNER JOIN inserted i
                ON c.idContrato = i.idContrato
            INNER JOIN deleted d
                ON i.idContrato = d.idContrato
            WHERE i.idEstadoContrato = 3
              AND d.idEstadoContrato <> 3
        )
        BEGIN
            THROW 60010,
                'ERROR: No se puede rescindir un contrato que ya tiene pagos registrados.',
                1;
        END;

        UPDATE c
        SET
            c.idEstadoPago = 4,
            c.saldoPendiente = 0
        FROM dbo.cuota c
        INNER JOIN inserted i
            ON c.idContrato = i.idContrato
        INNER JOIN deleted d
            ON i.idContrato = d.idContrato
        WHERE i.idEstadoContrato = 3
          AND d.idEstadoContrato <> 3
          AND c.idEstadoPago = 1;

        PRINT 'Cuotas pendientes anuladas automaticamente por rescision del contrato.';
    END;
END;
GO


DROP TRIGGER IF EXISTS dbo.trg_validar_desactivacion_proveedor;
GO

CREATE OR ALTER TRIGGER dbo.trg_validar_desactivacion_proveedor
ON dbo.proveedor
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM deleted d
        INNER JOIN dbo.ordencompra oc
            ON oc.idProveedor = d.idProveedor
        WHERE oc.idEstadoOrden = 1
    )
    BEGIN
        THROW 60020,
            'ERROR: No se puede eliminar el proveedor porque tiene ordenes de compra pendientes.',
            1;
    END;

    DELETE p
    FROM dbo.proveedor p
    INNER JOIN deleted d
        ON d.idProveedor = p.idProveedor;

    PRINT 'Proveedor eliminado correctamente porque no tiene ordenes pendientes.';
END;
GO


IF OBJECT_ID('dbo.historicoPrecioProveedorMaterial', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historicoPrecioProveedorMaterial (
        idHistorico INT IDENTITY(1,1) PRIMARY KEY,
        idProveedorMaterial INT NOT NULL,
        idProveedor INT NOT NULL,
        idMaterial INT NOT NULL,
        precioAnterior DECIMAL(10,2) NOT NULL,
        precioNuevo DECIMAL(10,2) NOT NULL,
        variacionPorcentual DECIMAL(8,2) NOT NULL,
        fechaCambio DATETIME NOT NULL DEFAULT GETDATE(),
        usuarioCambio NVARCHAR(128) NOT NULL DEFAULT SUSER_SNAME(),
        observacion NVARCHAR(255) NULL
    );
END;
GO


CREATE OR ALTER TRIGGER dbo.trg_historico_precio_proveedor_material
ON dbo.proveedormaterial
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(precioProveedor)
    BEGIN
        INSERT INTO dbo.historicoPrecioProveedorMaterial (
            idProveedorMaterial,
            idProveedor,
            idMaterial,
            precioAnterior,
            precioNuevo,
            variacionPorcentual,
            fechaCambio,
            usuarioCambio,
            observacion
        )
        SELECT
            i.idProveedorMaterial,
            i.idProveedor,
            i.idMaterial,
            d.precioProveedor,
            i.precioProveedor,
            CASE
                WHEN d.precioProveedor = 0 THEN 0
                ELSE CAST(((i.precioProveedor - d.precioProveedor) * 100.0) / d.precioProveedor AS DECIMAL(8,2))
            END,
            GETDATE(),
            SUSER_SNAME(),
            CASE
                WHEN i.precioProveedor > d.precioProveedor THEN N'Incremento de precio'
                WHEN i.precioProveedor < d.precioProveedor THEN N'Reduccion de precio'
                ELSE N'Sin variacion'
            END
        FROM inserted i
        INNER JOIN deleted d
            ON i.idProveedorMaterial = d.idProveedorMaterial
        WHERE i.precioProveedor <> d.precioProveedor;

        PRINT 'Cambio de precio registrado en el historico de proveedor-material.';
    END
END;
GO


CREATE OR ALTER TRIGGER dbo.trg_validar_precio_detalle_compra
ON dbo.detallecompra
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.ordencompra oc
            ON i.idOrdenCompra = oc.idOrdenCompra
        LEFT JOIN dbo.proveedormaterial pm
            ON pm.idProveedor = oc.idProveedor
           AND pm.idMaterial = i.idMaterial
        WHERE pm.idProveedorMaterial IS NULL
    )
    BEGIN
        THROW 60030,
            'ERROR: El material no esta registrado en el catalogo del proveedor de la orden de compra.',
            1;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.ordencompra oc
            ON i.idOrdenCompra = oc.idOrdenCompra
        INNER JOIN dbo.proveedormaterial pm
            ON pm.idProveedor = oc.idProveedor
           AND pm.idMaterial = i.idMaterial
        WHERE ABS(i.precioUnitario - pm.precioProveedor) > (pm.precioProveedor * 0.10)
    )
    BEGIN
        THROW 60031,
            'ERROR: El precio unitario excede en mas del 10% el precio acordado con el proveedor.',
            1;
    END;

    PRINT 'Precio unitario validado correctamente contra el catalogo del proveedor.';
END;
GO


USE constructora;
GO

GRANT INSERT, UPDATE ON detallecompra TO rol_logistica;
GRANT INSERT, UPDATE ON materialproyecto TO rol_jefe_obra;
GRANT INSERT, UPDATE ON registrohoras TO rol_jefe_obra;
GRANT INSERT, UPDATE ON ordencompra TO rol_logistica;
GO


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


CREATE OR ALTER TRIGGER trg_descontar_inventario_proyecto
ON materialproyecto
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
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
        PRINT 'ADVERTENCIA: El stock de uno o mas materiales bajo del minimo recomendado.';
    END

    PRINT 'Stock descontado correctamente del inventario.';
END;
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
        N' bajo del minimo. Stock actual: ' + CAST(i.stockActual AS NVARCHAR) +
        N' | Minimo requerido: ' + CAST(i.stockMinimo AS NVARCHAR)
    FROM inserted i
    WHERE i.stockActual < i.stockMinimo;

    IF @@ROWCOUNT > 0
        PRINT 'ALERTA REGISTRADA: Materiales por debajo del stock minimo.';
END;
GO


CREATE OR ALTER TRIGGER trg_revertir_inventario_orden_cancelada
ON ordencompra
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.idOrdenCompra = d.idOrdenCompra
        WHERE i.idEstadoOrden = 3 AND d.idEstadoOrden != 3
    )
    BEGIN
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