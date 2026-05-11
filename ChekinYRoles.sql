-- ENTREGA: CONSTRAINTS + ROLES + DEMOSTRACIONES
-- Sistema Empresa Constructora
-- Versión corregida y actualizada

USE constructora;
GO

-- PARTE 1: CHECK CONSTRAINTS
-- Se eliminan primero para evitar errores si el script se ejecuta más de una vez

ALTER TABLE dbo.empleado DROP CONSTRAINT IF EXISTS chk_empleado_email;
ALTER TABLE dbo.material DROP CONSTRAINT IF EXISTS chk_material_precio;
ALTER TABLE dbo.inventario DROP CONSTRAINT IF EXISTS chk_inventario_stock;
ALTER TABLE dbo.inventario DROP CONSTRAINT IF EXISTS chk_inventario_minimo;
ALTER TABLE dbo.contrato DROP CONSTRAINT IF EXISTS chk_contrato_monto;
ALTER TABLE dbo.contrato DROP CONSTRAINT IF EXISTS chk_contrato_fechas;
ALTER TABLE dbo.contrato DROP CONSTRAINT IF EXISTS chk_contrato_firma;
ALTER TABLE dbo.contrato DROP CONSTRAINT IF EXISTS chk_contrato_inicio;
ALTER TABLE dbo.cuota DROP CONSTRAINT IF EXISTS chk_cuota_monto;
ALTER TABLE dbo.cuota DROP CONSTRAINT IF EXISTS chk_cuota_saldo;
ALTER TABLE dbo.pagocliente DROP CONSTRAINT IF EXISTS chk_pagocli_monto;
ALTER TABLE dbo.pagoproveedor DROP CONSTRAINT IF EXISTS chk_pagoprov_monto;
ALTER TABLE dbo.pagoplanillaproyecto DROP CONSTRAINT IF EXISTS chk_pagoplan_monto;
ALTER TABLE dbo.ordencompra DROP CONSTRAINT IF EXISTS chk_orden_monto;
ALTER TABLE dbo.detallecompra DROP CONSTRAINT IF EXISTS chk_detcompra_cantidad;
ALTER TABLE dbo.detallecompra DROP CONSTRAINT IF EXISTS chk_detcompra_precio;
ALTER TABLE dbo.registrohoras DROP CONSTRAINT IF EXISTS chk_horas_trabajadas;
ALTER TABLE dbo.bonoantiguedadproyecto DROP CONSTRAINT IF EXISTS chk_bono_porcentaje;
ALTER TABLE dbo.bonoantiguedadproyecto DROP CONSTRAINT IF EXISTS chk_bono_salario;
ALTER TABLE dbo.proveedormaterial DROP CONSTRAINT IF EXISTS chk_provmat_precio;
ALTER TABLE dbo.proveedormaterial DROP CONSTRAINT IF EXISTS chk_provmat_entrega;
ALTER TABLE dbo.proyecto DROP CONSTRAINT IF EXISTS chk_proyecto_fechas;
ALTER TABLE dbo.detallecotizacioncliente DROP CONSTRAINT IF EXISTS chk_detcotcli_cantidad;
ALTER TABLE dbo.detallecotizacioncliente DROP CONSTRAINT IF EXISTS chk_detcotcli_precio;
ALTER TABLE dbo.detallecotizacioninterna DROP CONSTRAINT IF EXISTS chk_detcotint_cantidad;
ALTER TABLE dbo.detallecotizacioninterna DROP CONSTRAINT IF EXISTS chk_detcotint_costo;
ALTER TABLE dbo.detallecotizacionmanoobra DROP CONSTRAINT IF EXISTS chk_manoobra_horas;
ALTER TABLE dbo.detallecotizacionmanoobra DROP CONSTRAINT IF EXISTS chk_manoobra_personas;
GO

-- EMPLEADO
ALTER TABLE dbo.empleado
ADD CONSTRAINT chk_empleado_email CHECK (email LIKE '%@%.%');
GO

-- MATERIAL
ALTER TABLE dbo.material
ADD CONSTRAINT chk_material_precio CHECK (precioUnitario > 0);
GO

-- INVENTARIO
ALTER TABLE dbo.inventario
ADD CONSTRAINT chk_inventario_stock CHECK (stockActual >= 0);
GO

ALTER TABLE dbo.inventario
ADD CONSTRAINT chk_inventario_minimo CHECK (stockMinimo >= 0);
GO

-- CONTRATO
ALTER TABLE dbo.contrato
ADD CONSTRAINT chk_contrato_monto CHECK (montoTotal > 0);
GO

ALTER TABLE dbo.contrato
ADD CONSTRAINT chk_contrato_fechas CHECK (fechaVencimiento > fechaInicio);
GO

ALTER TABLE dbo.contrato
ADD CONSTRAINT chk_contrato_firma CHECK (fechaFirma >= fechaContrato);
GO

ALTER TABLE dbo.contrato
ADD CONSTRAINT chk_contrato_inicio CHECK (fechaInicio >= fechaFirma);
GO

-- CUOTA
ALTER TABLE dbo.cuota
ADD CONSTRAINT chk_cuota_monto CHECK (montoCuota > 0);
GO

ALTER TABLE dbo.cuota
ADD CONSTRAINT chk_cuota_saldo CHECK (saldoPendiente >= 0);
GO

-- PAGO CLIENTE
ALTER TABLE dbo.pagocliente
ADD CONSTRAINT chk_pagocli_monto CHECK (monto > 0);
GO

-- PAGO PROVEEDOR
ALTER TABLE dbo.pagoproveedor
ADD CONSTRAINT chk_pagoprov_monto CHECK (monto > 0);
GO

-- PAGO PLANILLA PROYECTO
ALTER TABLE dbo.pagoplanillaproyecto
ADD CONSTRAINT chk_pagoplan_monto CHECK (montoPagado > 0);
GO

-- ORDEN COMPRA
ALTER TABLE dbo.ordencompra
ADD CONSTRAINT chk_orden_monto CHECK (montoTotal > 0);
GO

-- DETALLE COMPRA
ALTER TABLE dbo.detallecompra
ADD CONSTRAINT chk_detcompra_cantidad CHECK (cantidad > 0);
GO

ALTER TABLE dbo.detallecompra
ADD CONSTRAINT chk_detcompra_precio CHECK (precioUnitario > 0);
GO

-- REGISTRO HORAS
ALTER TABLE dbo.registrohoras
ADD CONSTRAINT chk_horas_trabajadas CHECK (horasTrabajadas > 0 AND horasTrabajadas <= 8);
GO

-- BONO ANTIGÜEDAD PROYECTO
-- Se permite 0 porque hay empleados sin bono
ALTER TABLE dbo.bonoantiguedadproyecto
ADD CONSTRAINT chk_bono_porcentaje CHECK (porcentajeBono >= 0 AND porcentajeBono <= 25);
GO

ALTER TABLE dbo.bonoantiguedadproyecto
ADD CONSTRAINT chk_bono_salario CHECK (salarioBaseProyecto > 0);
GO

-- PROVEEDOR MATERIAL
ALTER TABLE dbo.proveedormaterial
ADD CONSTRAINT chk_provmat_precio CHECK (precioProveedor > 0);
GO

ALTER TABLE dbo.proveedormaterial
ADD CONSTRAINT chk_provmat_entrega CHECK (tiempoEntrega >= 0);
GO

-- PROYECTO
ALTER TABLE dbo.proyecto
ADD CONSTRAINT chk_proyecto_fechas CHECK (fechaFinEstimada > fechaInicio);
GO

-- DETALLE COTIZACION CLIENTE
ALTER TABLE dbo.detallecotizacioncliente
ADD CONSTRAINT chk_detcotcli_cantidad CHECK (cantidad > 0);
GO

ALTER TABLE dbo.detallecotizacioncliente
ADD CONSTRAINT chk_detcotcli_precio CHECK (precioUnitario > 0);
GO

-- DETALLE COTIZACION INTERNA
ALTER TABLE dbo.detallecotizacioninterna
ADD CONSTRAINT chk_detcotint_cantidad CHECK (cantidadEstimada > 0);
GO

ALTER TABLE dbo.detallecotizacioninterna
ADD CONSTRAINT chk_detcotint_costo CHECK (costoUnitarioEstimado > 0);
GO

-- DETALLE COTIZACION MANO OBRA
ALTER TABLE dbo.detallecotizacionmanoobra
ADD CONSTRAINT chk_manoobra_horas CHECK (horasEstimadas > 0);
GO

ALTER TABLE dbo.detallecotizacionmanoobra
ADD CONSTRAINT chk_manoobra_personas CHECK (cantidadPersonas > 0);
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
