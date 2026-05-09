-- MIGRACION A SQL SERVER
-- ENTREGA 1 -FASE 2: CONSTRAINTS + ROLES + DEMOSTRACIONES
-- Sistema Empresa Constructora


USE constructora;
GO
-- PARTE 1: CHECK CONSTRAINTS
-- EMPLEADO
ALTER TABLE empleado
ADD CONSTRAINT chk_empleado_salario
CHECK (salario > 0);
GO

ALTER TABLE empleado
ADD CONSTRAINT chk_empleado_email
CHECK (email LIKE '%@%.%');
GO

-- MATERIAL
ALTER TABLE material
ADD CONSTRAINT chk_material_precio
CHECK (precioUnitario > 0);
GO

-- INVENTARIO
ALTER TABLE inventario
ADD CONSTRAINT chk_inventario_stock
CHECK (stockActual >= 0);
GO

ALTER TABLE inventario
ADD CONSTRAINT chk_inventario_minimo
CHECK (stockMinimo >= 0);
GO

-- CONTRATO
ALTER TABLE contrato
ADD CONSTRAINT chk_contrato_monto
CHECK (montoTotal > 0);
GO

ALTER TABLE contrato
ADD CONSTRAINT chk_contrato_fechas
CHECK (fechaVencimiento > fechaInicio);
GO

-- CUOTA
ALTER TABLE cuota
ADD CONSTRAINT chk_cuota_monto
CHECK (montoCuota > 0);
GO

ALTER TABLE cuota
ADD CONSTRAINT chk_cuota_saldo
CHECK (saldoPendiente >= 0);
GO

-- PAGOCLIENTE
ALTER TABLE pagocliente
ADD CONSTRAINT chk_pagocli_monto
CHECK (monto > 0);
GO

-- PAGOPROVEEDOR
ALTER TABLE pagoproveedor
ADD CONSTRAINT chk_pagoprov_monto
CHECK (monto > 0);
GO

-- PAGOPLANILLA
ALTER TABLE pagoplanilla
ADD CONSTRAINT chk_pagoplan_monto
CHECK (monto > 0);
GO

-- ORDENCOMPRA
ALTER TABLE ordencompra
ADD CONSTRAINT chk_orden_monto
CHECK (montoTotal > 0);
GO

-- DETALLECOMPRA
ALTER TABLE detallecompra
ADD CONSTRAINT chk_detcompra_cantidad
CHECK (cantidad > 0);
GO

ALTER TABLE detallecompra
ADD CONSTRAINT chk_detcompra_precio
CHECK (precioUnitario > 0);
GO

-- REGISTROHORAS
ALTER TABLE registrohoras
ADD CONSTRAINT chk_horas_trabajadas
CHECK (horasTrabajadas > 0 AND horasTrabajadas <= 8);
GO

ALTER TABLE registrohoras
ADD CONSTRAINT chk_horas_pago
CHECK (pagoPorHora > 0);
GO

-- BONIFICACIONEMPLEADO
ALTER TABLE bonificacionempleado
ADD CONSTRAINT chk_bonif_porcentaje
CHECK (porcentajeBono > 0 AND porcentajeBono <= 100);
GO

ALTER TABLE bonificacionempleado
ADD CONSTRAINT chk_bonif_salario
CHECK (salarioBase > 0);
GO

-- PROVEEDORMATERIAL
ALTER TABLE proveedormaterial
ADD CONSTRAINT chk_provmat_precio
CHECK (precioProveedor > 0);
GO

ALTER TABLE proveedormaterial
ADD CONSTRAINT chk_provmat_entrega
CHECK (tiempoEntrega >= 0);
GO

-- PROYECTO
ALTER TABLE proyecto
ADD CONSTRAINT chk_proyecto_fechas
CHECK (fechaFinEstimada > fechaInicio);
GO
-- PARTE 2: ROLES

-- CREAR ROLES
CREATE ROLE rol_gerente;
GO

CREATE ROLE rol_contador;
GO

CREATE ROLE rol_jefe_obra;
GO

CREATE ROLE rol_rrhh;
GO

CREATE ROLE rol_secretaria;
GO

CREATE ROLE rol_logistica;
GO

CREATE ROLE rol_consulta;
GO

-- PERMISOS

-- GERENTE
GRANT CONTROL ON DATABASE::constructora TO rol_gerente;
GO

-- CONTADOR
GRANT SELECT, INSERT, UPDATE ON pagocliente TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON pagoproveedor TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON pagoplanilla TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON contrato TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON cuota TO rol_contador;
GO

-- JEFE DE OBRA
GRANT SELECT, INSERT, UPDATE ON proyecto TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON empleadoproyecto TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON materialproyecto TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON registrohoras TO rol_jefe_obra;
GO

-- RRHH
GRANT SELECT, INSERT, UPDATE ON empleado TO rol_rrhh;
GRANT SELECT, INSERT, UPDATE ON bonificacionempleado TO rol_rrhh;
GRANT SELECT, INSERT, UPDATE ON pagoplanilla TO rol_rrhh;
GO

-- SECRETARIA
GRANT SELECT, INSERT ON cliente TO rol_secretaria;
GRANT SELECT, INSERT ON contrato TO rol_secretaria;
GO

-- LOGISTICA
GRANT SELECT, INSERT, UPDATE ON ordencompra TO rol_logistica;
GRANT SELECT, INSERT, UPDATE ON detallecompra TO rol_logistica;
GRANT SELECT, INSERT, UPDATE ON inventario TO rol_logistica;
GO

-- CONSULTA
GRANT SELECT ON SCHEMA::dbo TO rol_consulta;
GO

-- PARTE 3: USUARIOS

CREATE LOGIN gerente_constructora
WITH PASSWORD = 'Gerente2026#';
GO

CREATE LOGIN contador_constructora
WITH PASSWORD = 'Contador2026#';
GO

CREATE LOGIN jefe_obra_constructora
WITH PASSWORD = 'JefeObra2026#';
GO

CREATE LOGIN rrhh_constructora
WITH PASSWORD = 'RRHH2026#';
GO

CREATE LOGIN secretaria_constructora
WITH PASSWORD = 'Secretaria2026#';
GO

CREATE LOGIN logistica_constructora
WITH PASSWORD = 'Logistica2026#';
GO

CREATE LOGIN consulta_constructora
WITH PASSWORD = 'Consulta2026#';
GO

-- CREAR USERS

CREATE USER gerente_constructora FOR LOGIN gerente_constructora;
CREATE USER contador_constructora FOR LOGIN contador_constructora;
CREATE USER jefe_obra_constructora FOR LOGIN jefe_obra_constructora;
CREATE USER rrhh_constructora FOR LOGIN rrhh_constructora;
CREATE USER secretaria_constructora FOR LOGIN secretaria_constructora;
CREATE USER logistica_constructora FOR LOGIN logistica_constructora;
CREATE USER consulta_constructora FOR LOGIN consulta_constructora;
GO

-- ASIGNAR ROLES

ALTER ROLE rol_gerente
ADD MEMBER gerente_constructora;
GO

ALTER ROLE rol_contador
ADD MEMBER contador_constructora;
GO

ALTER ROLE rol_jefe_obra
ADD MEMBER jefe_obra_constructora;
GO

ALTER ROLE rol_rrhh
ADD MEMBER rrhh_constructora;
GO

ALTER ROLE rol_secretaria
ADD MEMBER secretaria_constructora;
GO

ALTER ROLE rol_logistica
ADD MEMBER logistica_constructora;
GO

ALTER ROLE rol_consulta
ADD MEMBER consulta_constructora;
GO

-- PARTE 4: PROCEDIMIENTOS

CREATE OR ALTER PROCEDURE intentar_modificar_empleado
    @p_usuario VARCHAR(50)
AS
BEGIN

    IF @p_usuario NOT IN ('rrhh_constructora', 'gerente_constructora')
    BEGIN
        THROW 50001,
        'ACCESO DENEGADO: No tienes permiso para modificar empleados.',
        1;
    END

    PRINT 'ACCESO PERMITIDO: Puedes modificar empleados';

END;
GO

-- ============================================================

CREATE OR ALTER PROCEDURE intentar_eliminar_cliente
    @p_usuario VARCHAR(50)
AS
BEGIN

    IF @p_usuario = 'secretaria_constructora'
    BEGIN
        THROW 50002,
        'ACCESO DENEGADO: Secretaria no puede eliminar clientes.',
        1;
    END

    ELSE IF @p_usuario = 'consulta_constructora'
    BEGIN
        THROW 50003,
        'ACCESO DENEGADO: Consulta es solo lectura.',
        1;
    END

    ELSE
    BEGIN
        PRINT 'ACCESO PERMITIDO';
    END

END;
GO

-- ============================================================

CREATE OR ALTER PROCEDURE intentar_ver_pagos
    @p_usuario VARCHAR(50)
AS
BEGIN

    IF @p_usuario IN (
        'jefe_obra_constructora',
        'logistica_constructora',
        'secretaria_constructora',
        'rrhh_constructora'
    )
    BEGIN
        THROW 50004,
        'ACCESO DENEGADO: No tienes acceso a pagos.',
        1;
    END

    ELSE
    BEGIN
        PRINT 'ACCESO PERMITIDO: Puedes ver pagos';
    END

END;
GO

-- ============================================================

CREATE OR ALTER PROCEDURE intentar_modificar_contrato
    @p_usuario VARCHAR(50)
AS
BEGIN

    IF @p_usuario IN (
        'secretaria_constructora',
        'consulta_constructora',
        'rrhh_constructora',
        'logistica_constructora'
    )
    BEGIN
        THROW 50005,
        'ACCESO DENEGADO: No puedes modificar contratos.',
        1;
    END

    ELSE
    BEGIN
        PRINT 'ACCESO PERMITIDO: Puedes modificar contratos';
    END

END;
GO

-- PARTE 5: DEMOSTRACIONES
EXEC intentar_eliminar_cliente 'secretaria_constructora';
GO

EXEC intentar_eliminar_cliente 'consulta_constructora';
GO

EXEC intentar_ver_pagos 'logistica_constructora';
GO

EXEC intentar_ver_pagos 'jefe_obra_constructora';
GO

EXEC intentar_modificar_empleado 'consulta_constructora';
GO

EXEC intentar_modificar_empleado 'rrhh_constructora';
GO

EXEC intentar_ver_pagos 'contador_constructora';
GO

EXEC intentar_modificar_contrato 'gerente_constructora';
GO

SELECT name
FROM sys.database_principals
WHERE type IN ('S', 'U', 'R');
GO

SELECT *
FROM sys.database_role_members;
GO