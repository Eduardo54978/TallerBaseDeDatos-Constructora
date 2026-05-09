USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'constructora')
    CREATE DATABASE constructora;
GO

USE constructora;
GO
-- TABLA: cargo
IF OBJECT_ID('dbo.cargo', 'U') IS NULL
CREATE TABLE dbo.cargo (
    idCargo             INT             NOT NULL IDENTITY(1,1),
    nombreCargo         NVARCHAR(100)   NOT NULL,
    descripcionCargo    NVARCHAR(255)   NULL,
    CONSTRAINT PK_cargo PRIMARY KEY (idCargo)
);
GO
-- TABLA: departamento
IF OBJECT_ID('dbo.departamento', 'U') IS NULL
CREATE TABLE dbo.departamento (
    idDepartamento              INT             NOT NULL IDENTITY(1,1),
    nombreDepartamento          NVARCHAR(100)   NOT NULL,
    descripcionDepartamento     NVARCHAR(255)   NULL,
    CONSTRAINT PK_departamento PRIMARY KEY (idDepartamento)
);
GO
-- TABLA: estadoempleado
IF OBJECT_ID('dbo.estadoempleado', 'U') IS NULL
CREATE TABLE dbo.estadoempleado (
    idEstadoEmpleado            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoEmpleado        NVARCHAR(50)    NOT NULL,
    descripcionEstadoEmpleado   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoempleado PRIMARY KEY (idEstadoEmpleado)
);
GO
-- TABLA: estadopago
IF OBJECT_ID('dbo.estadopago', 'U') IS NULL
CREATE TABLE dbo.estadopago (
    idEstadoPago            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoPago        NVARCHAR(50)    NOT NULL,
    descripcionEstadoPago   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadopago PRIMARY KEY (idEstadoPago)
);
GO
-- TABLA: tipocliente
IF OBJECT_ID('dbo.tipocliente', 'U') IS NULL
CREATE TABLE dbo.tipocliente (
    idTipoCliente           INT             NOT NULL IDENTITY(1,1),
    nombreTipoCliente       NVARCHAR(50)    NOT NULL,
    descripcionTipoCliente  NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipocliente PRIMARY KEY (idTipoCliente)
);
GO
-- TABLA: estadocontrato
IF OBJECT_ID('dbo.estadocontrato', 'U') IS NULL
CREATE TABLE dbo.estadocontrato (
    idEstadoContrato            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoContrato        NVARCHAR(50)    NOT NULL,
    descripcionEstadoContrato   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadocontrato PRIMARY KEY (idEstadoContrato)
);
GO
-- TABLA: estadoproyecto
IF OBJECT_ID('dbo.estadoproyecto', 'U') IS NULL
CREATE TABLE dbo.estadoproyecto (
    idEstadoProyecto            INT             NOT NULL IDENTITY(1,1),
    nombreEstadoProyecto        NVARCHAR(50)    NOT NULL,
    descripcionEstadoProyecto   NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoproyecto PRIMARY KEY (idEstadoProyecto)
);
GO
-- TABLA: tipoproyecto
IF OBJECT_ID('dbo.tipoproyecto', 'U') IS NULL
CREATE TABLE dbo.tipoproyecto (
    idTipoProyecto              INT             NOT NULL IDENTITY(1,1),
    nombreTipoProyecto          NVARCHAR(100)   NOT NULL,
    descripcionTipoProyecto     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipoproyecto PRIMARY KEY (idTipoProyecto)
);
GO
-- TABLA: tipocontrato
IF OBJECT_ID('dbo.tipocontrato', 'U') IS NULL
CREATE TABLE dbo.tipocontrato (
    idTipoContrato              INT             NOT NULL IDENTITY(1,1),
    nombreTipoContrato          NVARCHAR(100)   NOT NULL,
    descripcionTipoContrato     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipocontrato PRIMARY KEY (idTipoContrato)
);
GO
-- TABLA: estadocotizacion
IF OBJECT_ID('dbo.estadocotizacion', 'U') IS NULL
CREATE TABLE dbo.estadocotizacion (
    idEstadoCotizacion              INT             NOT NULL IDENTITY(1,1),
    nombreEstadoCotizacion          NVARCHAR(50)    NOT NULL,
    descripcionEstadoCotizacion     NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadocotizacion PRIMARY KEY (idEstadoCotizacion)
);
GO
-- TABLA: tipomaterial
IF OBJECT_ID('dbo.tipomaterial', 'U') IS NULL
CREATE TABLE dbo.tipomaterial (
    idTipoMaterial              INT             NOT NULL IDENTITY(1,1),
    nombreTipoMaterial          NVARCHAR(100)   NOT NULL,
    descripcionTipoMaterial     NVARCHAR(255)   NULL,
    CONSTRAINT PK_tipomaterial PRIMARY KEY (idTipoMaterial)
);
GO
-- TABLA: unidadmedida
IF OBJECT_ID('dbo.unidadmedida', 'U') IS NULL
CREATE TABLE dbo.unidadmedida (
    idUnidadMedida              INT             NOT NULL IDENTITY(1,1),
    nombreUnidadMedida          NVARCHAR(50)    NOT NULL,
    descripcionUnidadMedida     NVARCHAR(255)   NULL,
    CONSTRAINT PK_unidadmedida PRIMARY KEY (idUnidadMedida)
);
GO
-- TABLA: estadoorden
IF OBJECT_ID('dbo.estadoorden', 'U') IS NULL
CREATE TABLE dbo.estadoorden (
    idEstadoOrden           INT             NOT NULL IDENTITY(1,1),
    nombreEstadoOrden       NVARCHAR(50)    NOT NULL,
    descripcionEstadoOrden  NVARCHAR(255)   NULL,
    CONSTRAINT PK_estadoorden PRIMARY KEY (idEstadoOrden)
);
GO
-- TABLA: metodopago
IF OBJECT_ID('dbo.metodopago', 'U') IS NULL
CREATE TABLE dbo.metodopago (
    idMetodoPago            INT             NOT NULL IDENTITY(1,1),
    nombreMetodoPago        NVARCHAR(50)    NOT NULL,
    descripcionMetodoPago   NVARCHAR(255)   NULL,
    CONSTRAINT PK_metodopago PRIMARY KEY (idMetodoPago)
);
GO
-- TABLA: rolproyecto
IF OBJECT_ID('dbo.rolproyecto', 'U') IS NULL
CREATE TABLE dbo.rolproyecto (
    idRolProyecto           INT             NOT NULL IDENTITY(1,1),
    nombreRolProyecto       NVARCHAR(50)    NOT NULL,
    descripcionRolProyecto  NVARCHAR(255)   NULL,
    CONSTRAINT PK_rolproyecto PRIMARY KEY (idRolProyecto)
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
    salario             DECIMAL(12,2)   NOT NULL,
    fechaContratacion   DATE            NOT NULL,
    idEstadoEmpleado    INT             NOT NULL,
    idCargo             INT             NOT NULL,
    idDepartamento      INT             NOT NULL,
    CONSTRAINT PK_empleado              PRIMARY KEY (idEmpleado),
    CONSTRAINT UQ_empleado_ci           UNIQUE (ci),
    CONSTRAINT FK_empleado_estado       FOREIGN KEY (idEstadoEmpleado)
        REFERENCES dbo.estadoempleado (idEstadoEmpleado),
    CONSTRAINT FK_empleado_cargo        FOREIGN KEY (idCargo)
        REFERENCES dbo.cargo (idCargo),
    CONSTRAINT FK_empleado_departamento FOREIGN KEY (idDepartamento)
        REFERENCES dbo.departamento (idDepartamento)
);
GO
-- TABLA: bonificacionempleado
-- NOTA: ENUM de MySQL → CHECK constraint en SQL Server
--       GENERATED ALWAYS AS (columna calculada)
IF OBJECT_ID('dbo.bonificacionempleado', 'U') IS NULL
CREATE TABLE dbo.bonificacionempleado (
    idBonificacion      INT             NOT NULL IDENTITY(1,1),
    idEmpleado          INT             NOT NULL,
    tipoBonificacion    NVARCHAR(20)    NOT NULL,
    aniosAntiguedad     INT             NULL,
    porcentajeBono      DECIMAL(5,2)    NOT NULL,
    salarioBase         DECIMAL(10,2)   NOT NULL,
    montoCalculado      AS (CAST((salarioBase * porcentajeBono) / 100 AS DECIMAL(12,2))) PERSISTED,
    gestion             SMALLINT        NOT NULL,   -- YEAR → SMALLINT en SQL Server
    descripcion         NVARCHAR(200)   NULL,
    idEstadoPago        INT             NULL,
    CONSTRAINT PK_bonificacionempleado      PRIMARY KEY (idBonificacion),
    CONSTRAINT CHK_tipoBonificacion         CHECK (tipoBonificacion IN (N'Antigüedad', N'Aguinaldo', N'Legal')),
    CONSTRAINT FK_bonificacion_empleado     FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_bonificacion_estadopago   FOREIGN KEY (idEstadoPago)
        REFERENCES dbo.estadopago (idEstadoPago)
);
GO

CREATE INDEX idx_bonificacion_empleado ON dbo.bonificacionempleado (idEmpleado);
CREATE INDEX idx_bonificacion_estado   ON dbo.bonificacionempleado (idEstadoPago);
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
    CONSTRAINT FK_proyecto_tipoproyecto     FOREIGN KEY (idTipoProyecto)
        REFERENCES dbo.tipoproyecto (idTipoProyecto),
    CONSTRAINT FK_proyecto_estadoproyecto   FOREIGN KEY (idEstadoProyecto)
        REFERENCES dbo.estadoproyecto (idEstadoProyecto),
    CONSTRAINT FK_proyecto_cliente          FOREIGN KEY (idCliente)
        REFERENCES dbo.cliente (idCliente)
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
    CONSTRAINT PK_cotizacioncliente             PRIMARY KEY (idCotizacionCliente),
    CONSTRAINT UQ_numeroCotizacionCliente       UNIQUE (numeroCotizacionCliente),
    CONSTRAINT FK_cotcli_proyecto               FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_cotcli_estadocotizacion       FOREIGN KEY (idEstadoCotizacion)
        REFERENCES dbo.estadocotizacion (idEstadoCotizacion)
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
    CONSTRAINT PK_cotizacioninterna             PRIMARY KEY (idCotizacionInterna),
    CONSTRAINT UQ_numeroCotizacionInterna       UNIQUE (numeroCotizacionInterna),
    CONSTRAINT FK_cotint_proyecto               FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_cotint_estadocotizacion       FOREIGN KEY (idEstadoCotizacion)
        REFERENCES dbo.estadocotizacion (idEstadoCotizacion)
);
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
    CONSTRAINT FK_orden_estadoorden     FOREIGN KEY (idEstadoOrden)
        REFERENCES dbo.estadoorden (idEstadoOrden),
    CONSTRAINT FK_orden_proveedor       FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor)
);
GO
-- TABLA: detallecompra
-- NOTA: columna calculada total = cantidad * precioUnitario
IF OBJECT_ID('dbo.detallecompra', 'U') IS NULL
CREATE TABLE dbo.detallecompra (
    idDetalleCompra INT             NOT NULL IDENTITY(1,1),
    idOrdenCompra   INT             NOT NULL,
    idMaterial      INT             NOT NULL,
    cantidad        DECIMAL(12,3)   NOT NULL,
    precioUnitario  DECIMAL(12,2)   NOT NULL,
    total           AS (CAST(cantidad * precioUnitario AS DECIMAL(15,2))) PERSISTED,
    CONSTRAINT PK_detallecompra         PRIMARY KEY (idDetalleCompra),
    CONSTRAINT FK_detcompra_orden       FOREIGN KEY (idOrdenCompra)
        REFERENCES dbo.ordencompra (idOrdenCompra),
    CONSTRAINT FK_detcompra_material    FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
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
    CONSTRAINT PK_detallecotizacioncliente  PRIMARY KEY (idDetalleCotizacionCliente),
    CONSTRAINT FK_detcotcli_cotizacion      FOREIGN KEY (idCotizacionCliente)
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
    CONSTRAINT PK_detallecotizacioninterna  PRIMARY KEY (idDetalleCotizacionInterna),
    CONSTRAINT FK_detcotint_cotizacion      FOREIGN KEY (idCotizacionInterna)
        REFERENCES dbo.cotizacioninterna (idCotizacionInterna),
    CONSTRAINT FK_detcotint_material        FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- TABLA: detallecotizacionmanoobra
IF OBJECT_ID('dbo.detallecotizacionmanoobra', 'U') IS NULL
CREATE TABLE dbo.detallecotizacionmanoobra (
    idDetalleManoObra   INT             NOT NULL IDENTITY(1,1),
    idCotizacionInterna INT             NOT NULL,
    idCargo             INT             NOT NULL,
    cantidadPersonas    INT             NOT NULL,
    horasEstimadas      DECIMAL(10,2)   NOT NULL,
    pagoPorHora         DECIMAL(10,2)   NOT NULL,
    totalEstimado       DECIMAL(12,2)   NULL,
    CONSTRAINT PK_detallecotizacionmanoobra     PRIMARY KEY (idDetalleManoObra),
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
    CONSTRAINT PK_empleadoproyecto          PRIMARY KEY (idEmpleadoProyecto),
    CONSTRAINT FK_empproy_empleado          FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_empproy_proyecto          FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_empproy_rol               FOREIGN KEY (idRolProyecto)
        REFERENCES dbo.rolproyecto (idRolProyecto)
);
GO
-- TABLA: inventario
-- NOTA: DEFAULT curdate() → DEFAULT CAST(GETDATE() AS DATE)
IF OBJECT_ID('dbo.inventario', 'U') IS NULL
CREATE TABLE dbo.inventario (
    idInventario        INT             NOT NULL IDENTITY(1,1),
    idMaterial          INT             NOT NULL,
    stockActual         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    stockMinimo         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    ubicacion           NVARCHAR(100)   NULL,
    fechaActualizacion  DATE            NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT PK_inventario        PRIMARY KEY (idInventario),
    CONSTRAINT FK_inventario_mat    FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
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
    CONSTRAINT PK_materialproyecto      PRIMARY KEY (idMaterialProyecto),
    CONSTRAINT FK_matproy_proyecto      FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto),
    CONSTRAINT FK_matproy_material      FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
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
-- TABLA: pagoplanilla
IF OBJECT_ID('dbo.pagoplanilla', 'U') IS NULL
CREATE TABLE dbo.pagoplanilla (
    idPagoPlanilla  INT             NOT NULL IDENTITY(1,1),
    idEmpleado      INT             NOT NULL,
    idBonificacion  INT             NOT NULL,
    fechaPago       DATE            NOT NULL,
    monto           DECIMAL(12,2)   NOT NULL,
    idMetodoPago    INT             NULL,
    idEstadoPago    INT             NULL,
    CONSTRAINT PK_pagoplanilla              PRIMARY KEY (idPagoPlanilla),
    CONSTRAINT FK_pagoplanilla_empleado     FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_pagoplanilla_bonif        FOREIGN KEY (idBonificacion)
        REFERENCES dbo.bonificacionempleado (idBonificacion),
    CONSTRAINT FK_pagoplanilla_metodo       FOREIGN KEY (idMetodoPago)
        REFERENCES dbo.metodopago (idMetodoPago),
    CONSTRAINT FK_pagoplanilla_estado       FOREIGN KEY (idEstadoPago)
        REFERENCES dbo.estadopago (idEstadoPago)
);
GO
-- TABLA: pagoproveedor
IF OBJECT_ID('dbo.pagoproveedor', 'U') IS NULL
CREATE TABLE dbo.pagoproveedor (
    idPagoProveedor INT             NOT NULL IDENTITY(1,1),
    idProveedor     INT             NOT NULL,
    fechaPago       DATE            NOT NULL,
    monto           DECIMAL(15,2)   NOT NULL,
    idMetodoPago    INT             NOT NULL,
    factura         NVARCHAR(100)   NULL,
    CONSTRAINT PK_pagoproveedor         PRIMARY KEY (idPagoProveedor),
    CONSTRAINT FK_pagoprov_proveedor    FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor),
    CONSTRAINT FK_pagoprov_metodo       FOREIGN KEY (idMetodoPago)
        REFERENCES dbo.metodopago (idMetodoPago)
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
    CONSTRAINT FK_provmat_proveedor     FOREIGN KEY (idProveedor)
        REFERENCES dbo.proveedor (idProveedor),
    CONSTRAINT FK_provmat_material      FOREIGN KEY (idMaterial)
        REFERENCES dbo.material (idMaterial)
);
GO
-- TABLA: registrohoras
IF OBJECT_ID('dbo.registrohoras', 'U') IS NULL
CREATE TABLE dbo.registrohoras (
    idRegistroHoras INT             NOT NULL IDENTITY(1,1),
    idEmpleado      INT             NOT NULL,
    idProyecto      INT             NOT NULL,
    fecha           DATE            NOT NULL,
    horasTrabajadas DECIMAL(5,2)    NOT NULL,
    pagoPorHora     DECIMAL(10,2)   NOT NULL,
    totalPago       DECIMAL(10,2)   NULL,
    CONSTRAINT PK_registrohoras         PRIMARY KEY (idRegistroHoras),
    CONSTRAINT FK_reghoras_empleado     FOREIGN KEY (idEmpleado)
        REFERENCES dbo.empleado (idEmpleado),
    CONSTRAINT FK_reghoras_proyecto     FOREIGN KEY (idProyecto)
        REFERENCES dbo.proyecto (idProyecto)
);
GO
-- STORED PROCEDURES (equivalentes a los de MySQL)
-- NOTA: SIGNAL SQLSTATE → RAISERROR / THROW en T-SQL

-- SP: intentar_eliminar_cliente
IF OBJECT_ID('dbo.intentar_eliminar_cliente', 'P') IS NOT NULL
    DROP PROCEDURE dbo.intentar_eliminar_cliente;
GO

CREATE PROCEDURE dbo.intentar_eliminar_cliente
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

-- SP: intentar_modificar_contrato
IF OBJECT_ID('dbo.intentar_modificar_contrato', 'P') IS NOT NULL
    DROP PROCEDURE dbo.intentar_modificar_contrato;
GO

CREATE PROCEDURE dbo.intentar_modificar_contrato
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

-- SP: intentar_modificar_empleado
IF OBJECT_ID('dbo.intentar_modificar_empleado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.intentar_modificar_empleado;
GO

CREATE PROCEDURE dbo.intentar_modificar_empleado
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

-- SP: intentar_ver_pagos
IF OBJECT_ID('dbo.intentar_ver_pagos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.intentar_ver_pagos;
GO

CREATE PROCEDURE dbo.intentar_ver_pagos
    @p_usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'jefe_obra_constructora'
        THROW 50001, 'ACCESO DENEGADO: El Jefe de Obra solo gestiona proyectos. Los pagos son responsabilidad del Contador.', 1;
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