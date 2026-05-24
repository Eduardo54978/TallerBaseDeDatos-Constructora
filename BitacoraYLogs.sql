-- ============================================================
--  BITÁCORA / LOGS DEL SISTEMA
--  Registra qué usuario (gerente, contador, etc.) hizo cada
--  movimiento: inicios de sesión y acciones de crear / editar /
--  eliminar en todos los módulos.
--
--  EJECUTAR una sola vez sobre la base 'constructora'.
-- ============================================================
USE constructora;
GO

IF OBJECT_ID('dbo.bitacora', 'U') IS NULL
CREATE TABLE dbo.bitacora (
    idBitacora      INT             NOT NULL IDENTITY(1,1),
    idUsuario       INT             NULL,           -- usuario que ejecutó la acción
    username        NVARCHAR(50)    NULL,
    rol             NVARCHAR(50)    NULL,           -- rol_gerente, rol_contador, ...
    nombreCompleto  NVARCHAR(150)   NULL,
    accion          NVARCHAR(20)    NOT NULL,       -- LOGIN, CREAR, EDITAR, ELIMINAR
    modulo          NVARCHAR(50)    NULL,           -- pagos, clientes, contratos, ...
    descripcion     NVARCHAR(500)   NULL,           -- texto legible de lo que pasó
    metodoHttp      NVARCHAR(10)    NULL,           -- POST, PUT, DELETE
    ruta            NVARCHAR(300)   NULL,           -- /api/pagos/planilla
    exito           BIT             NOT NULL,       -- 1 = la acción terminó bien
    fechaHora       DATETIME        NOT NULL,
    CONSTRAINT PK_bitacora PRIMARY KEY (idBitacora)
);
GO

-- Índices para que la pantalla "Movimientos" filtre rápido.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bitacora_fecha')
    CREATE INDEX IX_bitacora_fecha   ON dbo.bitacora (fechaHora DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bitacora_usuario')
    CREATE INDEX IX_bitacora_usuario ON dbo.bitacora (idUsuario);
GO
