
-- BASE DE DATOS: constructora
-- Migración COMPLETA v2 de MySQL a SQL Server (T-SQL)
-- Incluye tablas actualizadas del equipo + alertas_inventario
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'constructora')
    CREATE DATABASE constructora;
GO

USE constructora;
GO

-- TABLAS CATÁLOGO (sin dependencias)

IF OBJECT_ID('dbo.tipocliente', 'U') IS NULL
CREATE TABLE dbo.tipocliente (
    idTipoCliente           INT             NOT NULL IDENTITY(1,1),
    nombreTipoCliente       NVARCHAR(50)    NOT NULL,
    descripcionTipoCliente  NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipocliente PRIMARY KEY (idTipoCliente)
);
GO

IF OBJECT_ID('dbo.estadoproyecto', 'U') IS NULL
CREATE TABLE dbo.estadoproyecto (
    idEstadoProyecto            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoProyecto        NVARCHAR(50)    NOT NULL,
    descripcionEstadoProyecto   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoproyecto PRIMARY KEY (idEstadoProyecto)
);
GO

IF OBJECT_ID('dbo.tipoproyecto', 'U') IS NULL
CREATE TABLE dbo.tipoproyecto (
    idTipoProyecto              INT             NOT NULL IDENTITY(1,1),
    nombreTipoProyecto          NVARCHAR(100)   NOT NULL,
    descripcionTipoProyecto     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipoproyecto PRIMARY KEY (idTipoProyecto)
);
GO

IF OBJECT_ID('dbo.estadocontrato', 'U') IS NULL
CREATE TABLE dbo.estadocontrato (
    idEstadoContrato            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoContrato        NVARCHAR(50)    NOT NULL,
    descripcionEstadoContrato   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadocontrato PRIMARY KEY (idEstadoContrato)
);
GO

IF OBJECT_ID('dbo.tipocontrato', 'U') IS NULL
CREATE TABLE dbo.tipocontrato (
    idTipoContrato              INT             NOT NULL IDENTITY(1,1),
    nombreTipoContrato          NVARCHAR(100)   NOT NULL,
    descripcionTipoContrato     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipocontrato PRIMARY KEY (idTipoContrato)
);
GO

IF OBJECT_ID('dbo.estadocotizacion', 'U') IS NULL
CREATE TABLE dbo.estadocotizacion (
    idEstadoCotizacion              INT             NOT NULL IDENTITY(1,1),
    nombreEstadoCotizacion          NVARCHAR(50)    NOT NULL,
    descripcionEstadoCotizacion     NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadocotizacion PRIMARY KEY (idEstadoCotizacion)
);
GO

IF OBJECT_ID('dbo.departamento', 'U') IS NULL
CREATE TABLE dbo.departamento (
    idDepartamento              INT             NOT NULL IDENTITY(1,1),
    nombreDepartamento          NVARCHAR(100)   NOT NULL,
    descripcionDepartamento     NVARCHAR(255)   NULL,
    CONSTRAINT PK_departamento PRIMARY KEY (idDepartamento)
);
GO

IF OBJECT_ID('dbo.estadoorden', 'U') IS NULL
CREATE TABLE dbo.estadoorden (
    idEstadoOrden           INT             NOT NULL IDENTITY(1,1),
    nombreEstadoOrden       NVARCHAR(50)    NOT NULL,
    descripcionEstadoOrden  NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoorden PRIMARY KEY (idEstadoOrden)
);
GO

IF OBJECT_ID('dbo.tipomaterial', 'U') IS NULL
CREATE TABLE dbo.tipomaterial (
    idTipoMaterial              INT             NOT NULL IDENTITY(1,1),
    nombreTipoMaterial          NVARCHAR(100)   NOT NULL,
    descripcionTipoMaterial     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipomaterial PRIMARY KEY (idTipoMaterial)
);
GO

IF OBJECT_ID('dbo.unidadmedida', 'U') IS NULL
CREATE TABLE dbo.unidadmedida (
    idUnidadMedida              INT             NOT NULL IDENTITY(1,1),
    nombreUnidadMedida          NVARCHAR(50)    NOT NULL,
    descripcionUnidadMedida     NVARCHAR(255)   NULL,
    CONSTRAINT PK_unidadmedida PRIMARY KEY (idUnidadMedida)
);
GO

IF OBJECT_ID('dbo.estadoempleado', 'U') IS NULL
CREATE TABLE dbo.estadoempleado (
    idEstadoEmpleado            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoEmpleado        NVARCHAR(50)    NOT NULL,
    descripcionEstadoEmpleado   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoempleado PRIMARY KEY (idEstadoEmpleado)
);
GO

IF OBJECT_ID('dbo.estadopago', 'U') IS NULL
CREATE TABLE dbo.estadopago (
    idEstadoPago            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoPago        NVARCHAR(50)    NOT NULL,
    descripcionEstadoPago   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadopago PRIMARY KEY (idEstadoPago)
);
GO

IF OBJECT_ID('dbo.metodopago', 'U') IS NULL
CREATE TABLE dbo.metodopago (
    idMetodoPago            INT             NOT NULL IDENTITY(1,1),
    nombreMetodoPago        NVARCHAR(50)    NOT NULL,
    descripcionMetodoPago   NVARCHAR(255)   NULL,
    CONSTRAINT PK_metodopago PRIMARY KEY (idMetodoPago)
);
GO

IF OBJECT_ID('dbo.rolproyecto', 'U') IS NULL
CREATE TABLE dbo.rolproyecto (
    idRolProyecto           INT             NOT NULL IDENTITY(1,1),
    nombreRolProyecto       NVARCHAR(50)    NOT NULL,
    descripcionRolProyecto  NVARCHAR(255)   NULL,
    CONSTRAINT PK_rolproyecto PRIMARY KEY (idRolProyecto)
);
GO


-- TABLA: cargo
-- NUEVA: ahora incluye pagoPorHora (cambio del compañero)

IF OBJECT_ID('dbo.cargo', 'U') IS NULL
CREATE TABLE dbo.cargo (
    idCargo             INT             NOT NULL IDENTITY(1,1),
    nombreCargo         NVARCHAR(100)   NOT NULL,
    descripcionCargo    NVARCHAR(255)   NULL,
    pagoPorHora         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,  -- ← NUEVO
    CONSTRAINT PK_cargo PRIMARY KEY (idCargo)
);
GO

-- TABLA: proveedor
IF OBJECT_ID('dbo.proveedor', 'U') IS NULL
CREATE TABLE dbo.proveedor (
    idProveedor         INT             NOT NULL IDENTITY(1,1),
    nombreProveedor     NVARCHAR(150)   NOT NULL,
    numCelular          NVARCHAR(20)    NULL,
    email               NVARCHAR(100)   NULL,
    direccion           NVARCHAR(255)   NULL,
    ciudad              NVARCHAR(100)   NULL,
    pais                NVARCHAR(100)   NULL,
    CONSTRAINT PK_proveedor PRIMARY KEY (idProveedor)
);
GO

-- TABLA: empleado
-- NUEVO: salarioReferencial reemplaza salario

IF OBJECT_ID('dbo.empleado', 'U') IS NULL
CREATE TABLE dbo.empleado (
    idEmpleado          INT             NOT NULL IDENTITY(1,1),
    nombre              NVARCHAR(100)   NOT NULL,
    apellido            NVARCHAR(100)   NOT NULL,
    ci                  NVARCHAR(20)    NOT NULL,
    fechaNacimiento     DATE            NULL,
    especialidad        NVARCHAR(150)   NULL,
    numCelular          NVARCHAR(20)    NULL,
    email               NVARCHAR(100)   NULL,
    direccion           NVARCHAR(255)   NULL,
    salarioReferencial  DECIMAL(10,2)   NULL,           -- ← NUEVO (antes era salario)
    fechaContratacion   DATE            NOT NULL,
    idEstadoEmpleado    INT             NOT NULL,
    idCargo             INT             NOT NULL,
    idDepartamento      INT             NOT NULL,
    CONSTRAINT PK_empleado              PRIMARY KEY (idEmpleado),
    CONSTRAINT UQ_empleado_ci           UNIQUE (ci),
    CONSTRAINT CHK_empleado_email       CHECK (email LIKE '%@%.%'),
    CONSTRAINT FK_empleado_estado       FOREIGN KEY (idEstadoEmpleado)
        REFERENCES dbo.estadoempleado (idEstadoEmpleado),
    CONSTRAINT FK_empleado_cargo        FOREIGN KEY (idCargo)
        REFERENCES dbo.cargo (idCargo),
    CONSTRAINT FK_empleado_departamento FOREIGN KEY (idDepartamento)
        REFERENCES dbo.departamento (idDepartamento)
);
GO

-- TABLA: cliente

IF OBJECT_ID('dbo.cliente', 'U') IS NULL
CREATE TABLE dbo.cliente (
    idCliente       INT             NOT NULL IDENTITY(1,1),
    nombre          NVARCHAR(150)   NOT NULL,
    idTipoCliente   INT             NOT NULL,
    documentoID     NVARCHAR(20)    NOT NULL,
    numCelular      NVARCHAR(20)    NULL,
    email           NVARCHAR(100)   NULL,
    direccion       NVARCHAR(255)   NULL,
    fechaRegistro   DATE            NOT NULL,
    CONSTRAINT PK_cliente               PRIMARY KEY (idCliente),
    CONSTRAINT FK_cliente_tipocliente   FOREIGN KEY (idTipoCliente)
        REFERENCES dbo.tipocliente (idTipoCliente)
);
GO

-- TABLA: proyecto

IF OBJECT_ID('dbo.proyecto', 'U') IS NULL
CREATE TABLE dbo.proyecto (
    idProyecto          INT             NOT NULL IDENTITY(1,1),
    nombreProyecto      NVARCHAR(150)   NOT NULL,
    descripcion         NVARCHAR(500)   NULL,
    idTipoProyecto      INT             NOT NULL,
    ubicacion           NVARCHAR(255)   NULL,
    fechaInicio         DATE            NULL,
    fechaFinEstimada    DATE            NULL,
    fechaFinReal        DATE            NULL,
    idEstadoProyecto    INT             NOT NULL,
    idCliente           INT             NOT NULL,
    CONSTRAINT PK_proyecto                  PRIMARY KEY (idProyecto),
    CONSTRAINT CHK_proyecto_fechas          CHECK (fechaFinEstimada > fechaInicio),
    CONSTRAINT FK_proyecto_tipoproyecto     FOREIGN KEY (idTipoProyecto)
        REFERENCES dbo.tipoproyecto (idTipoProyecto),
    CONSTRAINT FK_proyecto_estadoproyecto   FOREIGN KEY (idEstadoProyecto)
        REFERENCES dbo.estadoproyecto (idEstadoProyecto),
    CONSTRAINT FK_proyecto_cliente          FOREIGN KEY (idCliente)
        REFERENCES dbo.cliente (idCliente)
);
GO

-- TABLA: margenproyecto
-- NUEVA: tabla que agregó el compañero

IF OBJECT_ID('dbo.margenproyecto', 'U') IS NULL
CREATE TABLE dbo.margenproyecto (
    idProyecto          INT             NOT NULL,
    porcentajeGanancia  DECIMAL(5,2)    NOT NULL DEFAULT 18.00,
    CONSTRAINT PK_margenproyecto        PRIMARY KEY (idProyecto),
    CONSTRAINT FK_margen_proyecto       FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto)
);
GO
-- TABLA: contrato
IF OBJECT_ID('dbo.contrato', 'U') IS NULL
CREATE TABLE dbo.contrato (
    idContrato          INT             NOT NULL IDENTITY(1,1),
    numeroContrato      NVARCHAR(50)    NOT NULL,
    idTipoContrato      INT             NOT NULL,
    fechaContrato       DATE            NULL,
    fechaFirma          DATE            NULL,
    fechaInicio         DATE            NULL,
    fechaVencimiento    DATE            NULL,
    montoTotal          DECIMAL(15,2)   NOT NULL,
    idEstadoContrato    INT             NOT NULL,
    idProyecto          INT             NOT NULL,
    CONSTRAINT PK_contrato                  PRIMARY KEY (idContrato),
    CONSTRAINT UQ_contrato_numero           UNIQUE (numeroContrato),
    CONSTRAINT CHK_contrato_monto           CHECK (montoTotal > 0),
    CONSTRAINT CHK_contrato_fechas          CHECK (fechaVencimiento > fechaInicio),
    CONSTRAINT CHK_contrato_firma           CHECK (fechaFirma >= fechaContrato),
    CONSTRAINT CHK_contrato_inicio          CHECK (fechaInicio >= fechaFirma),
    CONSTRAINT FK_contrato_tipocontrato     FOREIGN KEY (idTipoContrato)
        REFERENCES dbo.tipocontrato (idTipoContrato),
    CONSTRAINT FK_contrato_estadocontrato   FOREIGN KEY (idEstadoContrato)
        REFERENCES dbo.estadocontrato (idEstadoContrato),
    CONSTRAINT FK_contrato_proyecto         FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto)
);
GO

-- TABLA: cotizacioncliente
IF OBJECT_ID('dbo.cotizacioncliente', 'U') IS NULL
CREATE TABLE dbo.cotizacioncliente (
    idCotizacionCliente         INT             NOT NULL IDENTITY(1,1),
    numeroCotizacionCliente     NVARCHAR(50)    NOT NULL,
    fechaCotizacion             DATE            NOT NULL,
    fechaValidez                DATE            NULL,
    observaciones               NVARCHAR(MAX)   NULL,
    idProyecto                  INT             NOT NULL,
    idEstadoCotizacion          INT             NOT NULL,
    idCotizacionInterna         INT             NULL,           -- ← NUEVO: interna de origen (NULL si fue manual)
    porcentajeUtilidad          DECIMAL(6,2)    NULL,           -- ← NUEVO: % de utilidad aplicado al generar
    CONSTRAINT PK_cotizacioncliente         PRIMARY KEY (idCotizacionCliente),
    CONSTRAINT UQ_numeroCotizacionCliente   UNIQUE (numeroCotizacionCliente),
    CONSTRAINT FK_cotcli_proyecto           FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_cotcli_estadocotizacion   FOREIGN KEY (idEstadoCotizacion)
        REFERENCES dbo.estadocotizacion (idEstadoCotizacion)
    -- FK a cotizacioninterna se agrega más abajo (esa tabla se crea después)
);
GO

-- TABLA: cotizacioninterna
IF OBJECT_ID('dbo.cotizacioninterna', 'U') IS NULL
CREATE TABLE dbo.cotizacioninterna (
    idCotizacionInterna         INT             NOT NULL IDENTITY(1,1),
    numeroCotizacionInterna     NVARCHAR(50)    NOT NULL,
    fechaCotizacion             DATE            NOT NULL,
    observaciones               NVARCHAR(MAX)   NULL,
    idProyecto                  INT             NOT NULL,
    idEstadoCotizacion          INT             NOT NULL,
    CONSTRAINT PK_cotizacioninterna         PRIMARY KEY (idCotizacionInterna),
    CONSTRAINT UQ_numeroCotizacionInterna   UNIQUE (numeroCotizacionInterna),
    CONSTRAINT FK_cotint_proyecto           FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_cotint_estadocotizacion   FOREIGN KEY (idEstadoCotizacion)
        REFERENCES dbo.estadocotizacion (idEstadoCotizacion)
);
GO

-- FK de cotizacioncliente hacia la interna de origen (ambas tablas ya existen)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cotcli_cotinterna')
    ALTER TABLE dbo.cotizacioncliente
        ADD CONSTRAINT FK_cotcli_cotinterna FOREIGN KEY (idCotizacionInterna)
            REFERENCES dbo.cotizacioninterna (idCotizacionInterna);
GO
-- TABLA: cuota
IF OBJECT_ID('dbo.cuota', 'U') IS NULL
CREATE TABLE dbo.cuota (
    idCuota             INT             NOT NULL IDENTITY(1,1),
    idContrato          INT             NOT NULL,
    numeroCuota         INT             NOT NULL,
    fechaVencimiento    DATE            NOT NULL,
    montoCuota          DECIMAL(15,2)   NOT NULL,
    saldoPendiente      DECIMAL(15,2)   NOT NULL,
    idEstadoPago        INT             NOT NULL,
    CONSTRAINT PK_cuota             PRIMARY KEY (idCuota),
    CONSTRAINT CHK_cuota_monto      CHECK (montoCuota > 0),
    CONSTRAINT CHK_cuota_saldo      CHECK (saldoPendiente >= 0),
    CONSTRAINT FK_cuota_contrato    FOREIGN KEY (idContrato)
        REFERENCES dbo.contrato (idContrato),
    CONSTRAINT FK_cuota_estadopago  FOREIGN KEY (idEstadoPago)
        REFERENCES dbo.estadopago (idEstadoPago)
);
GO

-- TABLA: material
IF OBJECT_ID('dbo.material', 'U') IS NULL
CREATE TABLE dbo.material (
    idMaterial          INT             NOT NULL IDENTITY(1,1),
    nombreMaterial      NVARCHAR(150)   NOT NULL,
    idTipoMaterial      INT             NOT NULL,
    idUnidadMedida      INT             NOT NULL,
    precioUnitario      DECIMAL(12,2)   NOT NULL,
    descripcion         NVARCHAR(500)   NULL,
    CONSTRAINT PK_material              PRIMARY KEY (idMaterial),
    CONSTRAINT CHK_material_precio      CHECK (precioUnitario > 0),
    CONSTRAINT FK_material_tipo         FOREIGN KEY (idTipoMaterial)
        REFERENCES dbo.tipomaterial (idTipoMaterial),
    CONSTRAINT FK_material_unidad       FOREIGN KEY (idUnidadMedida)
        REFERENCES dbo.unidadmedida (idUnidadMedida)
);
GO
-- TABLA: ordencompra
IF OBJECT_ID('dbo.ordencompra', 'U') IS NULL
CREATE TABLE dbo.ordencompra (
    idOrdenCompra   INT             NOT NULL IDENTITY(1,1),
    fechaOrden      DATE            NOT NULL,
    idEstadoOrden   INT             NOT NULL,
    idProveedor     INT             NOT NULL,
    montoTotal      DECIMAL(15,2)   NOT NULL,
    CONSTRAINT PK_ordencompra           PRIMARY KEY (idOrdenCompra),
    CONSTRAINT CHK_orden_monto          CHECK (montoTotal > 0),
    CONSTRAINT FK_orden_estadoorden     FOREIGN KEY (idEstadoOrden)
        REFERENCES dbo.estadoorden (idEstadoOrden),
    CONSTRAINT FK_orden_proveedor       FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor)
);
GO

-- TABLA: detallecompra

IF OBJECT_ID('dbo.detallecompra', 'U') IS NULL
CREATE TABLE dbo.detallecompra (
    idDetalleCompra INT             NOT NULL IDENTITY(1,1),
    idOrdenCompra   INT             NOT NULL,
    idMaterial      INT             NOT NULL,
    cantidad        DECIMAL(12,3)   NOT NULL,
    precioUnitario  DECIMAL(12,2)   NOT NULL,
    total           AS (CAST(cantidad * precioUnitario AS DECIMAL(15,2))) PERSISTED,
    CONSTRAINT PK_detallecompra             PRIMARY KEY (idDetalleCompra),
    CONSTRAINT CHK_detcompra_cantidad       CHECK (cantidad > 0),
    CONSTRAINT CHK_detcompra_precio         CHECK (precioUnitario > 0),
    CONSTRAINT FK_detcompra_orden           FOREIGN KEY (idOrdenCompra)
        REFERENCES dbo.ordencompra (idOrdenCompra),
    CONSTRAINT FK_detcompra_material        FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- TABLA: inventario
-- NUEVO: incluye stockInicial (cambio del compañero)
IF OBJECT_ID('dbo.inventario', 'U') IS NULL
CREATE TABLE dbo.inventario (
    idInventario        INT             NOT NULL IDENTITY(1,1),
    idMaterial          INT             NOT NULL,
    stockInicial        DECIMAL(10,3)   NULL DEFAULT 0.000,     -- ← NUEVO
    stockActual         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    stockMinimo         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    ubicacion           NVARCHAR(100)   NULL,
    fechaActualizacion  DATE            NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT PK_inventario            PRIMARY KEY (idInventario),
    CONSTRAINT CHK_inventario_stock     CHECK (stockActual >= 0),
    CONSTRAINT CHK_inventario_minimo    CHECK (stockMinimo >= 0),
    CONSTRAINT FK_inventario_mat        FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- TABLA: alertas_inventario
-- NUEVA: para los triggers de control de inventario
IF OBJECT_ID('dbo.alertas_inventario', 'U') IS NULL
CREATE TABLE dbo.alertas_inventario (
    idAlerta        INT             NOT NULL IDENTITY(1,1),
    idMaterial      INT             NOT NULL,
    stockActual     DECIMAL(10,2)   NOT NULL,
    stockMinimo     DECIMAL(10,2)   NOT NULL,
    fechaAlerta     DATETIME        NOT NULL DEFAULT GETDATE(),
    mensaje         NVARCHAR(255)   NOT NULL,
    CONSTRAINT PK_alertas_inventario PRIMARY KEY (idAlerta)
);
GO
-- TABLA: detallecotizacioncliente
IF OBJECT_ID('dbo.detallecotizacioncliente', 'U') IS NULL
CREATE TABLE dbo.detallecotizacioncliente (
    idDetalleCotizacionCliente  INT             NOT NULL IDENTITY(1,1),
    idCotizacionCliente         INT             NOT NULL,
    concepto                    NVARCHAR(150)   NOT NULL,
    descripcion                 NVARCHAR(500)   NULL,
    cantidad                    DECIMAL(12,3)   NOT NULL,
    precioUnitario              DECIMAL(12,2)   NOT NULL,
    CONSTRAINT PK_detallecotizacioncliente      PRIMARY KEY (idDetalleCotizacionCliente),
    CONSTRAINT CHK_detcotcli_cantidad           CHECK (cantidad > 0),
    CONSTRAINT CHK_detcotcli_precio             CHECK (precioUnitario > 0),
    CONSTRAINT FK_detcotcli_cotizacion          FOREIGN KEY (idCotizacionCliente)
        REFERENCES dbo.cotizacioncliente (idCotizacionCliente)
);
GO

-- TABLA: detallecotizacioninterna

IF OBJECT_ID('dbo.detallecotizacioninterna', 'U') IS NULL
CREATE TABLE dbo.detallecotizacioninterna (
    idDetalleCotizacionInterna  INT             NOT NULL IDENTITY(1,1),
    idCotizacionInterna         INT             NOT NULL,
    idMaterial                  INT             NOT NULL,
    cantidadEstimada            DECIMAL(12,3)   NOT NULL,
    costoUnitarioEstimado       DECIMAL(12,2)   NOT NULL,
    CONSTRAINT PK_detallecotizacioninterna      PRIMARY KEY (idDetalleCotizacionInterna),
    CONSTRAINT CHK_detcotint_cantidad           CHECK (cantidadEstimada > 0),
    CONSTRAINT CHK_detcotint_costo              CHECK (costoUnitarioEstimado > 0),
    CONSTRAINT FK_detcotint_cotizacion          FOREIGN KEY (idCotizacionInterna)
        REFERENCES dbo.cotizacioninterna (idCotizacionInterna),
    CONSTRAINT FK_detcotint_material            FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO

-- TABLA: detallecotizacionmanoobra
-- pagoPorHora lo define el usuario por línea; el de cargo es solo sugerencia/fallback

IF OBJECT_ID('dbo.detallecotizacionmanoobra', 'U') IS NULL
CREATE TABLE dbo.detallecotizacionmanoobra (
    idDetalleManoObra   INT             NOT NULL IDENTITY(1,1),
    idCotizacionInterna INT             NOT NULL,
    idCargo             INT             NOT NULL,
    cantidadPersonas    INT             NOT NULL,
    horasEstimadas      DECIMAL(10,2)   NOT NULL,
    pagoPorHora         DECIMAL(10,2)   NULL,
    CONSTRAINT PK_detallecotizacionmanoobra     PRIMARY KEY (idDetalleManoObra),
    CONSTRAINT CHK_manoobra_horas               CHECK (horasEstimadas > 0),
    CONSTRAINT CHK_manoobra_personas            CHECK (cantidadPersonas > 0),
    CONSTRAINT FK_detmanoobra_cotizacion        FOREIGN KEY (idCotizacionInterna)
        REFERENCES dbo.cotizacioninterna (idCotizacionInterna),
    CONSTRAINT FK_detmanoobra_cargo             FOREIGN KEY (idCargo)
        REFERENCES dbo.cargo (idCargo)
);
GO

-- TABLA: empleadoproyecto

IF OBJECT_ID('dbo.empleadoproyecto', 'U') IS NULL
CREATE TABLE dbo.empleadoproyecto (
    idEmpleadoProyecto  INT     NOT NULL IDENTITY(1,1),
    idEmpleado          INT     NOT NULL,
    idProyecto          INT     NOT NULL,
    idRolProyecto       INT     NOT NULL,
    fechaInicio         DATE    NULL,
    fechaFin            DATE    NULL,
    CONSTRAINT PK_empleadoproyecto  PRIMARY KEY (idEmpleadoProyecto),
    CONSTRAINT FK_empproy_empleado  FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_empproy_proyecto  FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_empproy_rol       FOREIGN KEY (idRolProyecto)
        REFERENCES dbo.rolproyecto (idRolProyecto)
);
GO

-- TABLA: materialproyecto
IF OBJECT_ID('dbo.materialproyecto', 'U') IS NULL
CREATE TABLE dbo.materialproyecto (
    idMaterialProyecto  INT             NOT NULL IDENTITY(1,1),
    idProyecto          INT             NOT NULL,
    idMaterial          INT             NOT NULL,
    cantidadUtilizada   DECIMAL(12,3)   NOT NULL,
    fechaRegistro       DATE            NOT NULL,
    costoTotal          DECIMAL(15,2)   NOT NULL,
    CONSTRAINT PK_materialproyecto  PRIMARY KEY (idMaterialProyecto),
    CONSTRAINT FK_matproy_proyecto  FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_matproy_material  FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- TABLA: registrohoras
-- NUEVO: ya no tiene pagoPorHora ni totalPago
-- (el pago se calcula desde cargo.pagoPorHora)
IF OBJECT_ID('dbo.registrohoras', 'U') IS NULL
CREATE TABLE dbo.registrohoras (
    idRegistroHoras INT             NOT NULL IDENTITY(1,1),
    idEmpleado      INT             NOT NULL,
    idProyecto      INT             NOT NULL,
    fecha           DATE            NOT NULL,
    horasTrabajadas DECIMAL(5,2)    NOT NULL,
    CONSTRAINT PK_registrohoras         PRIMARY KEY (idRegistroHoras),
    CONSTRAINT CHK_horas_trabajadas     CHECK (horasTrabajadas > 0 AND horasTrabajadas <= 8),
    CONSTRAINT FK_reghoras_empleado     FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_reghoras_proyecto     FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto)
);
GO
-- TABLA: bonoantiguedadproyecto
-- NUEVA: tabla nueva que agregó el compañero
-- NOTA: GENERATED ALWAYS AS → columnas calculadas PERSISTED
--       YEAR → SMALLINT
IF OBJECT_ID('dbo.bonoantiguedadproyecto', 'U') IS NULL
CREATE TABLE dbo.bonoantiguedadproyecto (
    idBonoAntiguedadProyecto    INT             NOT NULL IDENTITY(1,1),
    idEmpleado                  INT             NOT NULL,
    idProyecto                  INT             NOT NULL,
    gestion                     SMALLINT        NOT NULL,
    aniosAntiguedad             INT             NOT NULL,
    porcentajeBono              DECIMAL(5,2)    NOT NULL,
    salarioBaseProyecto         DECIMAL(12,2)   NOT NULL,
    montoBono                   AS (CAST((salarioBaseProyecto * porcentajeBono) / 100 AS DECIMAL(12,2))) PERSISTED,
    salarioFinalProyecto        AS (CAST(salarioBaseProyecto + ((salarioBaseProyecto * porcentajeBono) / 100) AS DECIMAL(12,2))) PERSISTED,
    descripcion                 NVARCHAR(255)   NULL,
    CONSTRAINT PK_bonoantiguedadproyecto        PRIMARY KEY (idBonoAntiguedadProyecto),
    CONSTRAINT UQ_bono_empleado_proyecto_gestion UNIQUE (idEmpleado, idProyecto, gestion),
    CONSTRAINT FK_bonoant_emp                   FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_bonoant_proy                  FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto)
);
GO
-- TABLA: pagocliente
IF OBJECT_ID('dbo.pagocliente', 'U') IS NULL
CREATE TABLE dbo.pagocliente (
    idPagoCliente   INT             NOT NULL IDENTITY(1,1),
    idContrato      INT             NOT NULL,
    idCuota         INT             NOT NULL,
    fechaPago       DATE            NOT NULL,
    monto           DECIMAL(15,2)   NOT NULL,
    idMetodoPago    INT             NOT NULL,
    idEstadoPago    INT             NOT NULL,
    CONSTRAINT PK_pagocliente           PRIMARY KEY (idPagoCliente),
    CONSTRAINT CHK_pagocli_monto        CHECK (monto > 0),
    CONSTRAINT FK_pagocli_contrato      FOREIGN KEY (idContrato)
        REFERENCES dbo.contrato (idContrato),
    CONSTRAINT FK_pagocli_cuota         FOREIGN KEY (idCuota)
        REFERENCES dbo.cuota (idCuota),
    CONSTRAINT FK_pagocli_metodo        FOREIGN KEY (idMetodoPago)
        REFERENCES dbo.metodopago (idMetodoPago),
    CONSTRAINT FK_pagocli_estado        FOREIGN KEY (idEstadoPago)
        REFERENCES dbo.estadopago (idEstadoPago)
);
GO
-- TABLA: pagoproveedor
-- NUEVO: ahora incluye idOrdenCompra
IF OBJECT_ID('dbo.pagoproveedor', 'U') IS NULL
CREATE TABLE dbo.pagoproveedor (
    idPagoProveedor INT             NOT NULL IDENTITY(1,1),
    idProveedor     INT             NOT NULL,
    idOrdenCompra   INT             NULL,               -- ← NUEVO
    fechaPago       DATE            NOT NULL,
    monto           DECIMAL(15,2)   NOT NULL,
    idMetodoPago    INT             NOT NULL,
    factura         NVARCHAR(100)   NULL,
    CONSTRAINT PK_pagoproveedor             PRIMARY KEY (idPagoProveedor),
    CONSTRAINT CHK_pagoprov_monto           CHECK (monto > 0),
    CONSTRAINT FK_pagoprov_proveedor        FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor),
    CONSTRAINT FK_pagoprov_ordencompra      FOREIGN KEY (idOrdenCompra)
        REFERENCES dbo.ordencompra (idOrdenCompra),
    CONSTRAINT FK_pagoprov_metodo           FOREIGN KEY (idMetodoPago)
        REFERENCES dbo.metodopago (idMetodoPago)
);
GO
-- TABLA: pagoplanillaproyecto
-- NUEVA: reemplaza pagoplanilla, ahora vincula con
--        bonoantiguedadproyecto y proyecto

IF OBJECT_ID('dbo.pagoplanillaproyecto', 'U') IS NULL
CREATE TABLE dbo.pagoplanillaproyecto (
    idPagoPlanillaProyecto      INT             NOT NULL IDENTITY(1,1),
    idEmpleado                  INT             NOT NULL,
    idProyecto                  INT             NOT NULL,
    idBonoAntiguedadProyecto    INT             NOT NULL,
    fechaPago                   DATE            NOT NULL,
    montoPagado                 DECIMAL(12,2)   NOT NULL,
    idMetodoPago                INT             NOT NULL,
    idEstadoPago                INT             NOT NULL,
    CONSTRAINT PK_pagoplanillaproyecto          PRIMARY KEY (idPagoPlanillaProyecto),
    CONSTRAINT FK_pagoplan_empleado             FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_pagoplan_proyecto             FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_pagoplan_bono                 FOREIGN KEY (idBonoAntiguedadProyecto)
        REFERENCES dbo.bonoantiguedadproyecto (idBonoAntiguedadProyecto),
    CONSTRAINT FK_pagoplan_metodo               FOREIGN KEY (idMetodoPago)
        REFERENCES dbo.metodopago (idMetodoPago),
    CONSTRAINT FK_pagoplan_estado               FOREIGN KEY (idEstadoPago)
        REFERENCES dbo.estadopago (idEstadoPago)
);
GO
-- TABLA: proveedormaterial
IF OBJECT_ID('dbo.proveedormaterial', 'U') IS NULL
CREATE TABLE dbo.proveedormaterial (
    idProveedorMaterial INT             NOT NULL IDENTITY(1,1),
    idProveedor         INT             NOT NULL,
    idMaterial          INT             NOT NULL,
    precioProveedor     DECIMAL(12,2)   NOT NULL,
    tiempoEntrega       INT             NULL,
    CONSTRAINT PK_proveedormaterial     PRIMARY KEY (idProveedorMaterial),
    CONSTRAINT CHK_provmat_precio       CHECK (precioProveedor > 0),
    CONSTRAINT CHK_provmat_entrega      CHECK (tiempoEntrega >= 0),
    CONSTRAINT FK_provmat_proveedor     FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor),
    CONSTRAINT FK_provmat_material      FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- STORED PROCEDURES
CREATE OR ALTER PROCEDURE dbo.intentar_eliminar_cliente
    @p_usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'secretaria_constructora'
        THROW 50001, 'ACCESO DENEGADO: La Secretaria solo puede INSERTAR registros. No tiene permiso para ELIMINAR clientes.', 1;
    ELSE IF @p_usuario = 'consulta_constructora'
        THROW 50002, 'ACCESO DENEGADO: El rol Consulta solo puede VER datos. No puede eliminar ningun registro.', 1;
    ELSE IF @p_usuario = 'logistica_constructora'
        THROW 50003, 'ACCESO DENEGADO: Logistica solo gestiona compras e inventario. No tiene acceso a clientes.', 1;
    ELSE IF @p_usuario = 'rrhh_constructora'
        THROW 50004, 'ACCESO DENEGADO: Recursos Humanos no puede eliminar empleados ni clientes del sistema.', 1;
    ELSE IF @p_usuario = 'jefe_obra_constructora'
        THROW 50005, 'ACCESO DENEGADO: El Jefe de Obra no tiene acceso a datos de clientes.', 1;
    ELSE
        SELECT 'ACCESO PERMITIDO: Puedes eliminar registros.' AS resultado;
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_modificar_contrato
    @p_usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'secretaria_constructora'
        THROW 50001, 'ACCESO DENEGADO: La Secretaria puede registrar contratos pero no modificarlos.', 1;
    ELSE IF @p_usuario = 'consulta_constructora'
        THROW 50002, 'ACCESO DENEGADO: El rol Consulta es de solo lectura. No puedes modificar contratos.', 1;
    ELSE IF @p_usuario = 'rrhh_constructora'
        THROW 50003, 'ACCESO DENEGADO: Recursos Humanos no tiene acceso a contratos.', 1;
    ELSE IF @p_usuario = 'logistica_constructora'
        THROW 50004, 'ACCESO DENEGADO: Logistica no tiene acceso a contratos del sistema.', 1;
    ELSE IF @p_usuario = 'jefe_obra_constructora'
        THROW 50005, 'ACCESO DENEGADO: El Jefe de Obra no tiene acceso a contratos.', 1;
    ELSE
        SELECT 'ACCESO PERMITIDO: Puedes modificar contratos.' AS resultado;
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_modificar_empleado
    @p_usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'contador_constructora'
        THROW 50001, 'ACCESO DENEGADO: El Contador solo gestiona pagos y contratos. No puede modificar empleados.', 1;
    ELSE IF @p_usuario = 'jefe_obra_constructora'
        THROW 50002, 'ACCESO DENEGADO: El Jefe de Obra no tiene acceso a datos de empleados.', 1;
    ELSE IF @p_usuario = 'secretaria_constructora'
        THROW 50003, 'ACCESO DENEGADO: La Secretaria no puede modificar empleados.', 1;
    ELSE IF @p_usuario = 'logistica_constructora'
        THROW 50004, 'ACCESO DENEGADO: Logistica no tiene acceso a datos de empleados.', 1;
    ELSE IF @p_usuario = 'consulta_constructora'
        THROW 50005, 'ACCESO DENEGADO: El rol Consulta es de solo lectura. No puedes modificar ningun dato.', 1;
    ELSE
        SELECT 'ACCESO PERMITIDO: Puedes modificar empleados.' AS resultado;
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_ver_pagos
    @p_usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'jefe_obra_constructora'
        THROW 50001, 'ACCESO DENEGADO: El Jefe de Obra solo gestiona proyectos y materiales. Los pagos son responsabilidad del Contador.', 1;
    ELSE IF @p_usuario = 'logistica_constructora'
        THROW 50002, 'ACCESO DENEGADO: Logistica no tiene acceso a informacion financiera. Contacta al Contador.', 1;
    ELSE IF @p_usuario = 'secretaria_constructora'
        THROW 50003, 'ACCESO DENEGADO: La Secretaria no tiene acceso a pagos del sistema.', 1;
    ELSE IF @p_usuario = 'rrhh_constructora'
        THROW 50004, 'ACCESO DENEGADO: Recursos Humanos no tiene acceso a pagos de clientes ni proveedores.', 1;
    ELSE IF @p_usuario = 'consulta_constructora'
        THROW 50005, 'ACCESO DENEGADO: El rol Consulta es de solo lectura. No puedes acceder a pagos.', 1;
    ELSE
        SELECT 'ACCESO PERMITIDO: Puedes ver los pagos del sistema.' AS resultado;
END;
GO
-- VERIFICACIÓN FINAL
SELECT
    t.name AS Tabla,
    p.rows AS TotalFilas
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
ORDER BY t.name;
GO


