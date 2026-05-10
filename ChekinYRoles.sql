-- ENTREGA: CONSTRAINTS + ROLES + DEMOSTRACIONES
-- Sistema Empresa Constructora
-- Versión corregida y actualizada

USE constructora;
GO

-- PARTE 1: CHECK CONSTRAINTS

-- EMPLEADO
-- NOTA: salario cambió a salarioReferencial en la nueva versión
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

ALTER TABLE contrato
ADD CONSTRAINT chk_contrato_firma
CHECK (fechaFirma >= fechaContrato);
GO

ALTER TABLE contrato
ADD CONSTRAINT chk_contrato_inicio
CHECK (fechaInicio >= fechaFirma);
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

-- PAGOPLANILLAPROYECTO (reemplaza pagoplanilla)
ALTER TABLE pagoplanillaproyecto
ADD CONSTRAINT chk_pagoplan_monto
CHECK (montoPagado > 0);
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
-- NOTA: ya no tiene pagoPorHora, el pago viene de cargo.pagoPorHora
ALTER TABLE registrohoras
ADD CONSTRAINT chk_horas_trabajadas
CHECK (horasTrabajadas > 0 AND horasTrabajadas <= 8);
GO

-- BONOANTIGUEDADPROYECTO (reemplaza bonificacionempleado)
ALTER TABLE bonoantiguedadproyecto
ADD CONSTRAINT chk_bono_porcentaje
CHECK (porcentajeBono > 0 AND porcentajeBono <= 100);
GO

ALTER TABLE bonoantiguedadproyecto
ADD CONSTRAINT chk_bono_salario
CHECK (salarioBaseProyecto > 0);
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

-- DETALLECOTIZACIONCLIENTE
ALTER TABLE detallecotizacioncliente
ADD CONSTRAINT chk_detcotcli_cantidad
CHECK (cantidad > 0);
GO

ALTER TABLE detallecotizacioncliente
ADD CONSTRAINT chk_detcotcli_precio
CHECK (precioUnitario > 0);
GO

-- DETALLECOTIZACIONINTERNA
ALTER TABLE detallecotizacioninterna
ADD CONSTRAINT chk_detcotint_cantidad
CHECK (cantidadEstimada > 0);
GO

ALTER TABLE detallecotizacioninterna
ADD CONSTRAINT chk_detcotint_costo
CHECK (costoUnitarioEstimado > 0);
GO

-- DETALLECOTIZACIONMANOOBRA
ALTER TABLE detallecotizacionmanoobra
ADD CONSTRAINT chk_manoobra_horas
CHECK (horasEstimadas > 0);
GO

ALTER TABLE detallecotizacionmanoobra
ADD CONSTRAINT chk_manoobra_personas
CHECK (cantidadPersonas > 0);
GO
-- PARTE 2: ROLES

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_gerente')
    CREATE ROLE rol_gerente;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_contador')
    CREATE ROLE rol_contador;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_jefe_obra')
    CREATE ROLE rol_jefe_obra;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_rrhh')
    CREATE ROLE rol_rrhh;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_secretaria')
    CREATE ROLE rol_secretaria;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_logistica')
    CREATE ROLE rol_logistica;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_consulta')
    CREATE ROLE rol_consulta;
GO

-- PERMISOS POR ROL

-- GERENTE: control total
GRANT CONTROL ON DATABASE::constructora TO rol_gerente;
GO

-- CONTADOR: pagos, contratos y cuotas
GRANT SELECT, INSERT, UPDATE ON pagocliente        TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON pagoproveedor      TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON pagoplanillaproyecto TO rol_contador;  -- actualizado
GRANT SELECT, INSERT, UPDATE ON contrato           TO rol_contador;
GRANT SELECT, INSERT, UPDATE ON cuota              TO rol_contador;
GO

-- JEFE DE OBRA: proyectos, empleados en obra, materiales y horas
GRANT SELECT, INSERT, UPDATE ON proyecto           TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON empleadoproyecto   TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON materialproyecto   TO rol_jefe_obra;
GRANT SELECT, INSERT, UPDATE ON registrohoras      TO rol_jefe_obra;
GO

-- RRHH: empleados, bonos y planilla
GRANT SELECT, INSERT, UPDATE ON empleado               TO rol_rrhh;
GRANT SELECT, INSERT, UPDATE ON bonoantiguedadproyecto TO rol_rrhh;  -- actualizado
GRANT SELECT, INSERT, UPDATE ON pagoplanillaproyecto   TO rol_rrhh;  -- actualizado
GO

-- SECRETARIA: solo insertar clientes y contratos
GRANT SELECT, INSERT ON cliente   TO rol_secretaria;
GRANT SELECT, INSERT ON contrato  TO rol_secretaria;
GO

-- LOGISTICA: compras e inventario
GRANT SELECT, INSERT, UPDATE ON ordencompra   TO rol_logistica;
GRANT SELECT, INSERT, UPDATE ON detallecompra TO rol_logistica;
GRANT SELECT, INSERT, UPDATE ON inventario    TO rol_logistica;
GO

-- CONSULTA: solo lectura de todo
GRANT SELECT ON SCHEMA::dbo TO rol_consulta;
GO
-- PARTE 3: LOGINS Y USUARIOS
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gerente_constructora')
    CREATE LOGIN gerente_constructora WITH PASSWORD = 'Gerente2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'contador_constructora')
    CREATE LOGIN contador_constructora WITH PASSWORD = 'Contador2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'jefe_obra_constructora')
    CREATE LOGIN jefe_obra_constructora WITH PASSWORD = 'JefeObra2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'rrhh_constructora')
    CREATE LOGIN rrhh_constructora WITH PASSWORD = 'RRHH2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'secretaria_constructora')
    CREATE LOGIN secretaria_constructora WITH PASSWORD = 'Secretaria2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'logistica_constructora')
    CREATE LOGIN logistica_constructora WITH PASSWORD = 'Logistica2026#';
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'consulta_constructora')
    CREATE LOGIN consulta_constructora WITH PASSWORD = 'Consulta2026#';
GO
-- CREAR USUARIOS EN LA BASE DE DATOS

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'gerente_constructora')
    CREATE USER gerente_constructora FOR LOGIN gerente_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'contador_constructora')
    CREATE USER contador_constructora FOR LOGIN contador_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'jefe_obra_constructora')
    CREATE USER jefe_obra_constructora FOR LOGIN jefe_obra_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rrhh_constructora')
    CREATE USER rrhh_constructora FOR LOGIN rrhh_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'secretaria_constructora')
    CREATE USER secretaria_constructora FOR LOGIN secretaria_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'logistica_constructora')
    CREATE USER logistica_constructora FOR LOGIN logistica_constructora;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'consulta_constructora')
    CREATE USER consulta_constructora FOR LOGIN consulta_constructora;
GO

-- ASIGNAR ROLES A USUARIOS
ALTER ROLE rol_gerente    ADD MEMBER gerente_constructora;
GO
ALTER ROLE rol_contador   ADD MEMBER contador_constructora;
GO
ALTER ROLE rol_jefe_obra  ADD MEMBER jefe_obra_constructora;
GO
ALTER ROLE rol_rrhh       ADD MEMBER rrhh_constructora;
GO
ALTER ROLE rol_secretaria ADD MEMBER secretaria_constructora;
GO
ALTER ROLE rol_logistica  ADD MEMBER logistica_constructora;
GO
ALTER ROLE rol_consulta   ADD MEMBER consulta_constructora;
GO

-- PARTE 4: PROCEDIMIENTOS ALMACENADOS
CREATE OR ALTER PROCEDURE dbo.intentar_modificar_empleado
    @p_usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario NOT IN ('rrhh_constructora', 'gerente_constructora')
        THROW 50001, 'ACCESO DENEGADO: No tienes permiso para modificar empleados.', 1;

    PRINT 'ACCESO PERMITIDO: Puedes modificar empleados';
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_eliminar_cliente
    @p_usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario = 'secretaria_constructora'
        THROW 50002, 'ACCESO DENEGADO: Secretaria no puede eliminar clientes.', 1;
    ELSE IF @p_usuario = 'consulta_constructora'
        THROW 50003, 'ACCESO DENEGADO: Consulta es solo lectura.', 1;
    ELSE IF @p_usuario = 'logistica_constructora'
        THROW 50004, 'ACCESO DENEGADO: Logistica no tiene acceso a clientes.', 1;
    ELSE IF @p_usuario = 'rrhh_constructora'
        THROW 50005, 'ACCESO DENEGADO: RRHH no puede eliminar clientes.', 1;
    ELSE IF @p_usuario = 'jefe_obra_constructora'
        THROW 50006, 'ACCESO DENEGADO: Jefe de Obra no tiene acceso a clientes.', 1;
    ELSE
        PRINT 'ACCESO PERMITIDO: Puedes eliminar clientes';
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_ver_pagos
    @p_usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario IN (
        'jefe_obra_constructora',
        'logistica_constructora',
        'secretaria_constructora',
        'rrhh_constructora'
    )
        THROW 50007, 'ACCESO DENEGADO: No tienes acceso a pagos.', 1;
    ELSE
        PRINT 'ACCESO PERMITIDO: Puedes ver pagos';
END;
GO

CREATE OR ALTER PROCEDURE dbo.intentar_modificar_contrato
    @p_usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_usuario IN (
        'secretaria_constructora',
        'consulta_constructora',
        'rrhh_constructora',
        'logistica_constructora'
    )
        THROW 50008, 'ACCESO DENEGADO: No puedes modificar contratos.', 1;
    ELSE
        PRINT 'ACCESO PERMITIDO: Puedes modificar contratos';
END;
GO
-- PARTE 5: DEMOSTRACIONES
-- Secretaria NO puede eliminar cliente
EXEC dbo.intentar_eliminar_cliente 'secretaria_constructora';
GO

-- Consulta NO puede eliminar cliente
EXEC dbo.intentar_eliminar_cliente 'consulta_constructora';
GO

-- Logistica NO puede ver pagos
EXEC dbo.intentar_ver_pagos 'logistica_constructora';
GO

-- Jefe de obra NO puede ver pagos
EXEC dbo.intentar_ver_pagos 'jefe_obra_constructora';
GO

-- Consulta NO puede modificar empleados
EXEC dbo.intentar_modificar_empleado 'consulta_constructora';
GO

-- RRHH SI puede modificar empleados
EXEC dbo.intentar_modificar_empleado 'rrhh_constructora';
GO

-- Contador SI puede ver pagos
EXEC dbo.intentar_ver_pagos 'contador_constructora';
GO

-- Gerente SI puede modificar contratos
EXEC dbo.intentar_modificar_contrato 'gerente_constructora';
GO

-- VERIFICACIONES FINALES

-- Ver todos los usuarios y roles creados
SELECT
    name AS nombre,
    type_desc AS tipo
FROM sys.database_principals
WHERE type IN ('S', 'U', 'R')
AND name NOT LIKE '##%'
ORDER BY type_desc, name;
GO

-- Ver qué usuario pertenece a qué rol
SELECT
    r.name AS rol,
    m.name AS usuario
FROM sys.database_role_members rm
INNER JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
INNER JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
ORDER BY r.name;
GO
