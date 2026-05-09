-- DATOS COMPLETOS - Sistema Empresa Constructora
-- Migración de MySQL a SQL Server (T-SQL)
USE constructora;
GO

-- Desactivar constraints temporalmente para inserción
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO
-- GRUPO 1: CATÁLOGOS

SET IDENTITY_INSERT dbo.tipocliente ON;
INSERT INTO dbo.tipocliente (idTipoCliente, nombreTipoCliente, descripcionTipoCliente) VALUES
(1, 'Persona Natural', 'Cliente individual, persona física'),
(2, 'Empresa',         'Cliente corporativo o jurídico');
SET IDENTITY_INSERT dbo.tipocliente OFF;
GO

SET IDENTITY_INSERT dbo.estadoproyecto ON;
INSERT INTO dbo.estadoproyecto (idEstadoProyecto, nombreEstadoProyecto, descripcionEstadoProyecto) VALUES
(1, 'En planificación', 'El proyecto está en fase de diseño y planificación'),
(2, 'En ejecución',     'El proyecto está siendo construido activamente'),
(3, 'Finalizado',       'El proyecto ha sido completado y entregado'),
(4, 'Suspendido',       'El proyecto está temporalmente paralizado');
SET IDENTITY_INSERT dbo.estadoproyecto OFF;
GO

SET IDENTITY_INSERT dbo.tipoproyecto ON;
INSERT INTO dbo.tipoproyecto (idTipoProyecto, nombreTipoProyecto, descripcionTipoProyecto) VALUES
(1, 'Casa',            'Construcción de vivienda unifamiliar'),
(2, 'Edificio',        'Construcción de edificio multifamiliar o comercial'),
(3, 'Carretera',       'Construcción o mejoramiento de vías'),
(4, 'Puente',          'Construcción de puentes y obras de arte'),
(5, 'Local Comercial', 'Construcción de espacios comerciales');
SET IDENTITY_INSERT dbo.tipoproyecto OFF;
GO

SET IDENTITY_INSERT dbo.estadocontrato ON;
INSERT INTO dbo.estadocontrato (idEstadoContrato, nombreEstadoContrato, descripcionEstadoContrato) VALUES
(1, 'Vigente',    'Contrato activo y en cumplimiento'),
(2, 'Finalizado', 'Contrato cumplido y cerrado'),
(3, 'Rescindido', 'Contrato cancelado antes de su vencimiento');
SET IDENTITY_INSERT dbo.estadocontrato OFF;
GO

SET IDENTITY_INSERT dbo.tipocontrato ON;
INSERT INTO dbo.tipocontrato (idTipoContrato, nombreTipoContrato, descripcionTipoContrato) VALUES
(1, 'Obra completa',      'Se contrata la ejecución total de la obra'),
(2, 'Por etapas',         'La obra se ejecuta y paga por fases'),
(3, 'Por administración', 'La empresa administra recursos del cliente');
SET IDENTITY_INSERT dbo.tipocontrato OFF;
GO

SET IDENTITY_INSERT dbo.estadocotizacion ON;
INSERT INTO dbo.estadocotizacion (idEstadoCotizacion, nombreEstadoCotizacion, descripcionEstadoCotizacion) VALUES
(1, 'Pendiente', 'Cotización enviada, esperando respuesta'),
(2, 'Aprobado',  'Cotización aceptada por el cliente'),
(3, 'Rechazado', 'Cotización no aceptada por el cliente');
SET IDENTITY_INSERT dbo.estadocotizacion OFF;
GO

SET IDENTITY_INSERT dbo.departamento ON;
INSERT INTO dbo.departamento (idDepartamento, nombreDepartamento, descripcionDepartamento) VALUES
(1, 'Gerencia',     'Dirección y administración general'),
(2, 'Obras',        'Ejecución y supervisión de proyectos'),
(3, 'Diseño',       'Arquitectura e ingeniería de proyectos'),
(4, 'Contabilidad', 'Finanzas, pagos y contabilidad'),
(5, 'Logística',    'Compras, materiales y proveedores');
SET IDENTITY_INSERT dbo.departamento OFF;
GO

SET IDENTITY_INSERT dbo.estadoorden ON;
INSERT INTO dbo.estadoorden (idEstadoOrden, nombreEstadoOrden, descripcionEstadoOrden) VALUES
(1, 'Pendiente', 'Orden realizada, esperando entrega'),
(2, 'Entregada', 'Materiales recibidos conforme'),
(3, 'Cancelada', 'Orden anulada antes de la entrega');
SET IDENTITY_INSERT dbo.estadoorden OFF;
GO

SET IDENTITY_INSERT dbo.tipomaterial ON;
INSERT INTO dbo.tipomaterial (idTipoMaterial, nombreTipoMaterial, descripcionTipoMaterial) VALUES
(1, 'Cemento',   'Materiales cementantes y aglomerantes'),
(2, 'Acero',     'Varillas, mallas y perfiles de acero'),
(3, 'Madera',    'Tablones, vigas y madera en general'),
(4, 'Eléctrico', 'Cables, tuberías y accesorios eléctricos'),
(5, 'Áridos',    'Arena, grava y piedra triturada'),
(6, 'Pintura',   'Pinturas, barnices y selladores'),
(7, 'Cerámica',  'Pisos, azulejos y revestimientos');
SET IDENTITY_INSERT dbo.tipomaterial OFF;
GO

SET IDENTITY_INSERT dbo.unidadmedida ON;
INSERT INTO dbo.unidadmedida (idUnidadMedida, nombreUnidadMedida, descripcionUnidadMedida) VALUES
(1, 'kg',     'Kilogramo'),
(2, 'bolsa',  'Bolsa (50 kg)'),
(3, 'm',      'Metro lineal'),
(4, 'm²',     'Metro cuadrado'),
(5, 'm³',     'Metro cúbico'),
(6, 'unidad', 'Pieza o unidad'),
(7, 'rollo',  'Rollo de cable o manguera'),
(8, 'litro',  'Litro');
SET IDENTITY_INSERT dbo.unidadmedida OFF;
GO

SET IDENTITY_INSERT dbo.estadoempleado ON;
INSERT INTO dbo.estadoempleado (idEstadoEmpleado, nombreEstadoEmpleado, descripcionEstadoEmpleado) VALUES
(1, 'Activo',   'Empleado trabajando actualmente'),
(2, 'Inactivo', 'Empleado que ya no trabaja en la empresa');
SET IDENTITY_INSERT dbo.estadoempleado OFF;
GO

SET IDENTITY_INSERT dbo.rolproyecto ON;
INSERT INTO dbo.rolproyecto (idRolProyecto, nombreRolProyecto, descripcionRolProyecto) VALUES
(1, 'Director',   'Dirige y toma decisiones en el proyecto'),
(2, 'Supervisor', 'Supervisa el avance y calidad de la obra'),
(3, 'Técnico',    'Ejecuta tareas técnicas especializadas'),
(4, 'Operario',   'Realiza trabajos manuales en la obra');
SET IDENTITY_INSERT dbo.rolproyecto OFF;
GO

SET IDENTITY_INSERT dbo.estadopago ON;
INSERT INTO dbo.estadopago (idEstadoPago, nombreEstadoPago, descripcionEstadoPago) VALUES
(1, 'Pendiente',  'Pago aún no realizado'),
(2, 'Registrado', 'Pago registrado en el sistema'),
(3, 'Verificado', 'Pago confirmado y validado'),
(4, 'Anulado',    'Pago cancelado o revertido');
SET IDENTITY_INSERT dbo.estadopago OFF;
GO

SET IDENTITY_INSERT dbo.metodopago ON;
INSERT INTO dbo.metodopago (idMetodoPago, nombreMetodoPago, descripcionMetodoPago) VALUES
(1, 'Transferencia', 'Transferencia bancaria'),
(2, 'Cheque',        'Pago mediante cheque'),
(3, 'Efectivo',      'Pago en efectivo');
SET IDENTITY_INSERT dbo.metodopago OFF;
GO

SET IDENTITY_INSERT dbo.cargo ON;
INSERT INTO dbo.cargo (idCargo, nombreCargo, descripcionCargo) VALUES
(1,  'Gerente General',          'Responsable de la dirección general'),
(2,  'Jefe de Obra',             'Supervisa la ejecución de obras en campo'),
(3,  'Arquitecto',               'Diseño y planificación de proyectos'),
(4,  'Ingeniero Civil',          'Cálculo estructural y supervisión técnica'),
(5,  'Electricista',             'Instalaciones eléctricas en obra'),
(6,  'Albañil',                  'Trabajos de mampostería y acabados'),
(7,  'Contador',                 'Gestión contable y financiera'),
(8,  'Asistente Administrativo', 'Apoyo en tareas administrativas'),
(9,  'Plomero',                  'Instalaciones sanitarias y tuberías'),
(10, 'Soldador',                 'Trabajos de soldadura y metalurgia'),
(11, 'Carpintero',               'Trabajos en madera y carpintería'),
(12, 'Pintor',                   'Trabajos de pintura y acabados');
SET IDENTITY_INSERT dbo.cargo OFF;
GO

-- GRUPO 2: CLIENTES

SET IDENTITY_INSERT dbo.cliente ON;
INSERT INTO dbo.cliente (idCliente, nombre, idTipoCliente, documentoID, numCelular, email, direccion, fechaRegistro) VALUES
(1,  N'Carlos Mendoza Ríos',          1, '7823451',    '70012345', 'carlos.mendoza@gmail.com',      N'Av. Heroínas 123',         '2023-01-15'),
(2,  N'María Fernández Vega',         1, '6541237',    '71023456', 'maria.fernandez@gmail.com',     'Calle Sucre 456',           '2023-03-22'),
(3,  'Constructora Horizonte SRL',    2, '1023456789', '72034567', 'contacto@horizonte.com.bo',     'Av. Blanco Galindo Km 5',   '2022-11-10'),
(4,  'Inmobiliaria Los Andes SA',     2, '2034567890', '73045678', 'info@losandes.com.bo',          N'Av. América 789',          '2022-08-05'),
(5,  'Roberto Salinas Peña',          1, '5312789',    '74056789', 'roberto.salinas@hotmail.com',   'Calle Baptista 321',        '2024-01-08'),
(6,  'Empresa Boliviana Const. SRL',  2, '3045678901', '75067890', 'info@bolivianacnst.com.bo',     N'Av. Villazón 100',         '2023-05-20'),
(7,  N'Ana Lucía Torres',             1, '4123456',    '76078901', 'ana.torres@gmail.com',          'Calle Hamiraya 200',        '2023-07-14'),
(8,  'Grupo Inmobiliario Norte SA',   2, '5156789012', '77089012', 'contacto@gruponorte.com.bo',    'Av. Oquendo 300',           '2022-06-30'),
(9,  'Pedro Vargas Condori',          1, '6234567',    '78090123', 'pedro.vargas@hotmail.com',      'Zona Norte Bloque 5',       '2024-02-18'),
(10, 'Inversiones del Sur Ltda',      2, '7267890123', '79001234', 'info@inversionesdelsur.com',    'Av. Tadeo Haenke 400',      '2023-09-05'),
(11, 'Luis Quispe Mamani',            1, '8345678',    '70112345', 'luis.quispe@gmail.com',         'Villa Pagador Zona A',      '2024-03-10'),
(12, 'Constructora Andina SA',        2, '9378901234', '71123456', 'info@constructoraandina.com',   'Parque Industrial Sur',     '2022-04-22'),
(13, 'Carmen Rosa Flores',            1, '1456789',    '72134567', 'carmen.flores@gmail.com',       'Calle Lanza 500',           '2023-11-30'),
(14, 'Desarrollo Urbano Cba SRL',     2, '2489012345', '73145678', 'contacto@desarrollourbano.com', N'Av. Ballivián 600',        '2023-02-14'),
(15, 'Jorge Mamani Quispe',           1, '3512345',    '74156789', 'jorge.mamani@gmail.com',        'Calle Punata 700',          '2024-04-05'),
(16, 'Edificaciones Modernas SA',     2, '4545678901', '75167890', 'info@edificacionesmod.com',     N'Av. 6 de Agosto 800',      '2022-12-18'),
(17, N'Sofía Chávez Torrico',         1, '5623456',    '76178901', 'sofia.chavez@gmail.com',        'Calle Baptista 900',        '2024-05-22'),
(18, 'Proyectos y Obras Ltda',        2, '6656789012', '77189012', 'info@proyectosyobras.com',      'Zona Sur Calle 10',         '2023-06-08'),
(19, 'Miguel Torrico Vega',           1, '7734567',    '78190123', 'miguel.torrico@gmail.com',      N'Av. Heroínas 1000',        '2024-06-15'),
(20, 'Constr. Familiar Norte SRL',    2, '8767890123', '79201234', 'info@constfamiliar.com',        'Zona Norte Av. Principal',  '2022-10-25');
SET IDENTITY_INSERT dbo.cliente OFF;
GO
-- GRUPO 3: PROVEEDORES

SET IDENTITY_INSERT dbo.proveedor ON;
INSERT INTO dbo.proveedor (idProveedor, nombreProveedor, numCelular, email, direccion, ciudad, pais) VALUES
(1,  'Cementos Fancesa',        '42201100', 'ventas@fancesa.com.bo',       'Av. Industrial 100',         'Sucre',      'Bolivia'),
(2,  'Aceros del Sur SRL',      '72100200', 'info@acerosdelsur.com',       'Parque Industrial Zona Sur', 'Cochabamba', 'Bolivia'),
(3,  N'Maderería El Pino',      '71300400', 'elpino@gmail.com',            'Calle Comercio 55',          'Cochabamba', 'Bolivia'),
(4,  'Electro Materiales SA',   '70400500', 'ventas@electroma.com.bo',     N'Av. 6 de Agosto 200',       'La Paz',     'Bolivia'),
(5,  N'Áridos y Pétreos Norte', '71500600', 'aridos.norte@gmail.com',      'Carretera al Norte Km 3',    'Cochabamba', 'Bolivia'),
(6,  'Pinturas Rex Bolivia',    '72600700', 'ventas@pinturesrex.com.bo',   N'Av. América 300',           'Cochabamba', 'Bolivia'),
(7,  N'Cerámicas del Valle SRL','73700800', 'info@ceramicasvalle.com',     'Zona Industrial Este',       'Cochabamba', 'Bolivia'),
(8,  N'Ferretería Central SA',  '74800900', 'ventas@ferreteriacentral.com','Calle Comercio 100',         'Cochabamba', 'Bolivia'),
(9,  'Materiales Bolivia Ltda', '75900001', 'info@materialesbolivia.com',  'Av. Blanco Galindo Km 8',    'Cochabamba', 'Bolivia'),
(10, 'Distribuidora Norte SRL', '76001002', 'ventas@distribnorte.com',     'Zona Norte Av. Industrial',  'Cochabamba', 'Bolivia');
SET IDENTITY_INSERT dbo.proveedor OFF;
GO

-- =====================================================
-- GRUPO 4: MATERIALES
-- =====================================================

SET IDENTITY_INSERT dbo.material ON;
INSERT INTO dbo.material (idMaterial, nombreMaterial, idTipoMaterial, idUnidadMedida, precioUnitario, descripcion) VALUES
(1,  'Cemento IP-30 Fancesa',   1, 2,  58.00, N'Cemento pórtland IP-30, bolsa 50kg'),
(2,  'Varilla de acero 12mm',   2, 1,   8.50, 'Varilla corrugada 12mm diámetro'),
(3,  'Varilla de acero 8mm',    2, 1,   5.20, 'Varilla corrugada 8mm diámetro'),
(4,  N'Tablón de madera 2x8',   3, 3,  35.00, N'Tablón de madera pino 2x8 pulgadas'),
(5,  'Cable eléctrico 12AWG',   4, 7,  85.00, 'Cable THW 12 AWG rollo 100m'),
(6,  'Arena fina',              5, 5,  80.00, N'Arena fina para construcción m³'),
(7,  'Grava 3/4',               5, 5,  95.00, 'Grava triturada 3/4 pulgada m³'),
(8,  N'Pintura látex blanca',   6, 8,  45.00, N'Pintura látex interior/exterior litro'),
(9,  N'Piso cerámico 45x45',    7, 4,  65.00, N'Cerámica de piso 45x45 cm m²'),
(10, 'Cemento blanco',          1, 2,  90.00, 'Cemento blanco para juntas'),
(11, 'Ladrillo 6 huecos',       1, 6,   2.50, N'Ladrillo cerámico 6 huecos'),
(12, 'Fierro corrugado 10mm',   2, 1,   6.80, 'Varilla corrugada 10mm diámetro'),
(13, 'Madera tornillo 1x3',     3, 3,  18.00, 'Madera tornillo 1x3 pulgadas metro'),
(14, N'Tubería PVC 4 pulgadas', 4, 3,  25.00, N'Tubería PVC desagüe 4 pulgadas metro'),
(15, 'Pintura esmalte colores', 6, 8,  55.00, N'Esmalte sintético colores litro');
SET IDENTITY_INSERT dbo.material OFF;
GO

-- =====================================================
-- GRUPO 5: EMPLEADOS
-- =====================================================

SET IDENTITY_INSERT dbo.empleado ON;

-- Gerentes (idCargo=1, idDepartamento=1)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(1, 'Juan Pablo',    'Rojas Soria',    '4512378', '1975-05-12', N'Administración de Empresas', '70011111', 'jp.rojas@const.com',      'Av. Oquendo 100',   15000.00, '2010-03-01', 1, 1, 1),
(2, 'Marco Antonio', 'Villanueva Paz', '4623489', '1972-08-20', N'Gestión Empresarial',        '70022222', 'ma.villanueva@const.com', 'Calle Sucre 200',   14500.00, '2011-06-15', 1, 1, 1),
(3, 'Rosa Elena',    N'Gutierrez Vega','4734590', '1978-03-15', N'Administración',             '70033333', 're.gutierrez@const.com',  N'Av. Ballivián 300',14000.00, '2012-01-10', 1, 1, 1),
(4, 'Carlos',        'Mendez Flores',  '4845601', '1980-11-30', N'Dirección de Empresas',      '70044444', 'c.mendez@const.com',      'Calle Lanza 400',   15500.00, '2009-09-01', 1, 1, 1),
(5, 'Patricia',      'Rios Condori',   '4956712', '1976-07-22', N'Gestión y Dirección',        '70055555', 'p.rios@const.com',        N'Av. América 500',  13500.00, '2013-04-20', 1, 1, 1);

-- Jefes de Obra (idCargo=2, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(6,  'Luis Alberto', 'Mamani Flores',  '5623489', '1985-08-20', N'Ingeniería Civil',     '71022222', 'l.mamani@const.com',    'Calle Lanza 200',        10000.00, '2017-06-15', 1, 2, 2),
(7,  'Pedro',        'Condori Quispe', '5734590', '1978-11-30', 'Maestro de Obra',       '71033333', 'p.condori@const.com',   'Villa Pagador',            9500.00, '2016-09-01', 1, 2, 2),
(8,  'Ramiro',       'Torrico Mamani', '5845601', '1982-04-15', N'Construcción Civil',   '71044444', 'r.torrico@const.com',   'Zona Sur Bloque 3',        9800.00, '2015-03-10', 1, 2, 2),
(9,  'Gonzalo',      N'Pérez Vega',   '5956712', '1980-09-25', N'Ingeniería Civil',     '71055555', 'g.perez@const.com',     'Av. Tadeo Haenke 300',     9200.00, '2018-07-20', 1, 2, 2),
(10, 'Hernando',     'Flores Cruz',   '5067823', '1983-02-14', N'Construcción',         '71066666', 'h.flores@const.com',    'Calle Punata 400',          9600.00, '2016-11-05', 1, 2, 2),
(11, 'Renato',       'Quispe Tarqui', '5178934', '1981-06-30', 'Obras Civiles',         '71077777', 'r.quispe@const.com',    'Zona Norte Bloque 2',       9400.00, '2017-02-28', 1, 2, 2),
(12, 'Freddy',       'Choque Marca',  '5289045', '1979-10-18', 'Maestro Mayor',         '71088888', 'f.choque@const.com',    N'Av. Heroínas 600',         9700.00, '2015-08-15', 1, 2, 2),
(13, 'Nelson',       'Vargas Aguilar','5390156', '1984-03-05', N'Construcción Civil',   '71099999', 'n.vargas@const.com',    'Calle Baptista 700',        9300.00, '2018-01-22', 1, 2, 2),
(14, 'Walter',       'Lima Soria',    '5401267', '1977-07-12', 'Obras y Proyectos',     '71111110', 'w.lima@const.com',      'Av. Blanco Galindo 800',    9800.00, '2014-05-30', 1, 2, 2),
(15, 'Alvaro',       'Salinas Torrez','5512378', '1986-12-08', N'Ingeniería Civil',     '71122221', 'a.salinas@const.com',   'Zona Sur Av. 2',            9100.00, '2019-03-17', 1, 2, 2);

-- Arquitectos (idCargo=3, idDepartamento=3)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(16, 'Ana Cecilia', 'Torrico Vega',   '6734590', '1990-03-15', 'Arquitectura',                '72033333', 'a.torrico@const.com', N'Av. Ballivián 300',   9000.00, '2018-01-10', 1, 3, 3),
(17, 'Daniela',     'Rojas Mamani',   '6845601', '1992-07-22', N'Diseño Arquitectónico',      '72044444', 'd.rojas@const.com',   'Calle Sucre 400',      8800.00, '2019-05-15', 1, 3, 3),
(18, N'Verónica',   'Paz Condori',    '6956712', '1988-11-08', 'Arquitectura y Urbanismo',    '72055555', 'v.paz@const.com',     N'Av. América 500',     9200.00, '2017-08-20', 1, 3, 3),
(19, 'Claudia',     'Mendez Flores',  '6067823', '1991-04-30', N'Diseño Interior',            '72066666', 'c.mendez@const.com',  'Calle Lanza 600',      8600.00, '2020-02-10', 1, 3, 3),
(20, 'Fernando',    'Quispe Cruz',    '6178934', '1987-09-14', 'Arquitectura',                '72077777', 'f.quispe@const.com',  'Zona Norte Bloque 3',  9100.00, '2018-06-25', 1, 3, 3),
(21, 'Gabriela',    'Vargas Torrico', '6289045', '1993-01-28', N'Diseño y Construcción',      '72088888', 'g.vargas@const.com',  'Av. Tadeo Haenke 700', 8400.00, '2021-03-08', 1, 3, 3),
(22, 'Ricardo',     'Choque Lima',    '6390156', '1986-06-15', 'Arquitectura Sostenible',     '72099999', 'r.choque@const.com',  'Calle Punata 800',     9300.00, '2017-09-30', 1, 3, 3),
(23, 'Mariana',     'Aguilar Soria',  '6401267', '1994-10-02', N'Diseño Arquitectónico',      '72111110', 'm.aguilar@const.com', 'Zona Sur Av. 3',       8200.00, '2022-01-17', 1, 3, 3),
(24, N'Sebastián',  'Torrez Mamani',  '6512378', '1989-02-19', 'Arquitectura',                '72122221', 's.torrez@const.com',  N'Av. Heroínas 900',    9000.00, '2018-11-04', 1, 3, 3),
(25, 'Natalia',     'Flores Vega',    '6623489', '1992-07-06', N'Diseño de Interiores',       '72133332', 'n.flores@const.com',  'Calle Baptista 1000',  8700.00, '2020-07-21', 1, 3, 3),
(26, 'Alejandro',   'Cruz Condori',   '6734502', '1985-11-23', N'Arquitectura y Diseño',      '72144443', 'al.cruz@const.com',   N'Av. Ballivián 1100',  9400.00, '2016-04-08', 1, 3, 3),
(27, 'Patricia',    'Mamani Quispe',  '6845613', '1991-03-10', N'Diseño Urbano',              '72155554', 'pa.mamani@const.com', 'Calle Sucre 1200',     8500.00, '2020-10-25', 1, 3, 3),
(28, 'Eduardo',     'Rojas Torrico',  '6956724', '1988-08-27', 'Arquitectura',                '72166665', 'e.rojas@const.com',   'Zona Norte Av. 4',     9100.00, '2018-02-12', 1, 3, 3),
(29, 'Valeria',     'Paz Flores',     '6067835', '1993-12-14', N'Diseño Arquitectónico',      '72177776', 'val.paz@const.com',   N'Av. América 1300',    8300.00, '2021-08-29', 1, 3, 3),
(30, 'Christian',   'Mendez Cruz',    '6178946', '1987-04-01', 'Arquitectura Residencial',    '72188887', 'ch.mendez@const.com', 'Calle Lanza 1400',     9200.00, '2017-05-16', 1, 3, 3);

-- Ingenieros Civiles (idCargo=4, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(31, 'Luis',      'Castro Mamani',   '7512378', '1983-05-12', N'Ingeniería Civil',        '73011111', 'l.castro@const.com', 'Av. Oquendo 200',       10500.00, '2015-03-01', 1, 4, 2),
(32, 'Mario',     'Gutierrez Paz',   '7623489', '1986-08-20', 'Estructuras',              '73022222', 'ma.gut@const.com',   'Calle Sucre 300',       10200.00, '2016-06-15', 1, 4, 2),
(33, 'Roberto',   'Torrico Flores',  '7734590', '1981-03-15', N'Ingeniería Estructural',  '73033333', 'r.torr@const.com',   N'Av. América 400',      10800.00, '2014-01-10', 1, 4, 2),
(34, 'Claudio',   'Mendez Vega',     '7845601', '1984-11-30', N'Cálculo Estructural',     '73044444', 'cl.mend@const.com',  'Calle Lanza 500',        9900.00, '2017-09-01', 1, 4, 2),
(35, 'Sergio',    'Quispe Aguilar',  '7956712', '1979-07-22', N'Ingeniería Civil',        '73055555', 's.quisp@const.com',  'Zona Sur Bloque 4',     11000.00, '2013-04-20', 1, 4, 2),
(36, 'Rodrigo',   'Vargas Condori',  '7067823', '1988-02-14', N'Topografía',              '73066666', 'ro.varg@const.com',  'Av. Tadeo Haenke 600', 10000.00, '2018-07-01', 1, 4, 2),
(37, 'Arturo',    'Choque Mamani',   '7178934', '1982-06-30', N'Ingeniería Civil',        '73077777', 'ar.choq@const.com',  'Zona Norte Bloque 5',  10300.00, '2016-02-28', 1, 4, 2),
(38, 'Nelson',    'Lima Torrico',    '7289045', '1985-10-18', 'Geotecnia',                '73088888', 'ne.lima@const.com',  N'Av. Heroínas 700',     10100.00, '2017-08-15', 1, 4, 2),
(39, 'Diego',     'Salinas Flores',  '7390156', '1980-03-05', N'Ingeniería Estructural',  '73099999', 'di.sal@const.com',   'Calle Baptista 800',   10600.00, '2015-05-30', 1, 4, 2),
(40, 'Alejandro', 'Rojas Cruz',      '7401267', '1987-07-12', N'Cálculo y Diseño',        '73111110', 'ale.roj@const.com',  'Zona Sur Av. 5',        9800.00, '2019-03-17', 1, 4, 2),
(41, 'Cristian',  'Paz Mamani',      '7512389', '1983-12-08', N'Ingeniería Civil',        '73122221', 'cr.paz@const.com',   N'Av. Ballivián 900',   10400.00, '2016-10-22', 1, 4, 2),
(42, 'Danilo',    'Condori Vega',    '7623490', '1986-04-25', N'Estructuras Metálicas',   '73133332', 'da.cond@const.com',  'Calle Sucre 1000',      9700.00, '2018-01-09', 1, 4, 2),
(43, 'Esteban',   'Torrico Cruz',    '7734601', '1981-09-11', N'Ingeniería Civil',        '73144443', 'es.torr@const.com',  N'Av. América 1100',    10700.00, '2014-07-26', 1, 4, 2),
(44, 'Fabian',    'Mendez Aguilar',  '7845712', '1984-01-28', N'Hidráulica',              '73155554', 'fa.mend@const.com',  'Calle Lanza 1200',     10200.00, '2017-03-13', 1, 4, 2),
(45, 'German',    'Quispe Torrico',  '7956823', '1979-06-14', N'Ingeniería Sísmica',      '73166665', 'ge.quis@const.com',  'Zona Norte Bloque 6',  11200.00, '2013-09-30', 1, 4, 2),
(46, 'Hernan',    'Vargas Mamani',   '7067934', '1988-10-01', N'Ingeniería Civil',        '73177776', 'he.varg@const.com',  'Av. Tadeo Haenke 800',  9900.00, '2018-04-17', 1, 4, 2),
(47, 'Ivan',      'Choque Flores',   '7178045', '1982-02-18', N'Topografía y Geodesia',   '73188887', 'iv.choq@const.com',  'Zona Sur Bloque 6',    10300.00, '2016-11-04', 1, 4, 2),
(48, 'Julian',    'Lima Cruz',       '7289156', '1985-07-05', N'Ingeniería Civil',        '73199998', 'ju.lima@const.com',  N'Av. Heroínas 900',    10000.00, '2017-06-21', 1, 4, 2),
(49, 'Kevin',     'Salinas Vega',    '7390267', '1980-11-22', N'Estructuras de Hormigón', '73211109', 'ke.sal@const.com',   'Calle Baptista 1000',  10800.00, '2015-02-08', 1, 4, 2),
(50, 'Leonel',    'Rojas Condori',   '7401378', '1987-03-09', N'Ingeniería Civil',        '73222220', 'le.roj@const.com',   'Zona Sur Av. 7',        9600.00, '2019-08-25', 1, 4, 2);

-- Electricistas (idCargo=5, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(51, 'Marco',    'Villanueva Cruz', '8067823', '1988-02-14', 'Electricidad Industrial',   '74066666', 'm.vill@const.com',  'Av. Tadeo Haenke 500', 6500.00, '2020-07-01', 1, 5, 2),
(52, 'Pablo',    'Torrez Mamani',   '8178934', '1985-06-30', 'Instalaciones Eléctricas',  '74077777', 'pa.torr@const.com', 'Calle Punata 600',     6200.00, '2019-02-28', 1, 5, 2),
(53, 'Raul',     'Aguilar Soria',   '8289045', '1990-10-18', 'Electricidad Residencial',  '74088888', 'ra.agui@const.com', 'Zona Sur Av. 8',       6800.00, '2021-08-15', 1, 5, 2),
(54, 'Simon',    'Lima Flores',     '8390156', '1987-03-05', N'Alta Tensión',             '74099999', 'si.lima@const.com', N'Av. Heroínas 800',    7000.00, '2019-05-30', 1, 5, 2),
(55, 'Tomas',    'Salinas Condori', '8401267', '1983-07-12', 'Electricidad Industrial',   '74111110', 'to.sal@const.com',  'Calle Baptista 900',   6600.00, '2018-03-17', 1, 5, 2),
(56, 'Ulises',   'Rojas Vega',      '8512378', '1991-12-08', 'Instalaciones Eléctricas',  '74122221', 'ul.roj@const.com',  'Zona Norte Bloque 7',  6300.00, '2022-10-22', 1, 5, 2),
(57, 'Victor',   'Paz Cruz',        '8623489', '1986-04-25', 'Electricidad Residencial',  '74133332', 'vi.paz@const.com',  N'Av. Ballivián 1000',  6700.00, '2020-01-09', 1, 5, 2),
(58, 'Wilson',   'Condori Mamani',  '8734590', '1989-09-11', N'Alta Tensión',             '74144443', 'wi.cond@const.com', 'Calle Sucre 1100',     7100.00, '2021-07-26', 1, 5, 2),
(59, 'Xavier',   'Torrico Aguilar', '8845601', '1984-01-28', 'Electricidad Industrial',   '74155554', 'xa.torr@const.com', N'Av. América 1200',    6400.00, '2019-03-13', 1, 5, 2),
(60, 'Yandel',   'Mendez Flores',   '8956712', '1992-06-14', 'Instalaciones Eléctricas',  '74166665', 'ya.mend@const.com', 'Calle Lanza 1300',     6100.00, '2022-09-30', 1, 5, 2),
(61, 'Zenon',    'Quispe Torrico',  '8067834', '1987-10-01', 'Electricidad Industrial',   '74177776', 'ze.quis@const.com', 'Zona Sur Bloque 8',    6900.00, '2020-04-17', 1, 5, 2),
(62, 'Abdon',    'Vargas Cruz',     '8178945', '1985-02-18', N'Alta Tensión',             '74188887', 'ab.varg@const.com', 'Av. Tadeo Haenke 900', 7200.00, '2019-11-04', 1, 5, 2),
(63, 'Benigno',  'Choque Mamani',   '8289056', '1990-07-05', 'Electricidad Residencial',  '74199998', 'be.choq@const.com', 'Zona Norte Bloque 8',  6500.00, '2021-06-21', 1, 5, 2),
(64, 'Cirilo',   'Lima Vega',       '8390167', '1983-11-22', 'Instalaciones Eléctricas',  '74211109', 'ci.lima@const.com', N'Av. Heroínas 1000',   6800.00, '2018-02-08', 1, 5, 2),
(65, 'Dionisio', 'Salinas Soria',   '8401278', '1988-03-09', 'Electricidad Industrial',   '74222220', 'di.sal2@const.com', 'Calle Baptista 1100',  6200.00, '2020-08-25', 1, 5, 2);

-- Albañiles (idCargo=6, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(66, 'Carlos',    'Mamani Quispe',  '9234567', '1990-03-10', N'Mampostería y acabados', '75111111', 'ca.mam@const.com',   'Villa Pagador A',       4500.00, '2020-01-15', 1, 6, 2),
(67, 'Roberto',   'Flores Choque',  '9345678', '1988-07-22', N'Albañilería general',    '75222222', 'ro.flo@const.com',   'Zona Sur Bloque 3',     4200.00, '2019-06-01', 1, 6, 2),
(68, 'Miguel',    'Quispe Tarqui',  '9456789', '1992-11-05', 'Revoque y tarrajeo',      '75333333', 'mi.quis@const.com',  'Calle Punata 200',      4300.00, '2021-03-10', 1, 6, 2),
(69, 'Fernando',  'Cruz Aguilar',   '9567890', '1985-04-18', N'Mampostería fina',       '75444444', 'fe.cru@const.com',   'Av. Tadeo Haenke 100',  4600.00, '2018-08-20', 1, 6, 2),
(70, 'Victor',    'Condori Marca',  '9678901', '1995-09-30', 'Acabados y revestidos',   '75555555', 'vi.con@const.com',   'Calle Lanza 300',       4100.00, '2022-02-01', 1, 6, 2),
(71, 'Esteban',   'Torrez Lima',    '9789012', '1987-01-15', N'Albañilería',            '75666666', 'es.tor@const.com',   'Zona Norte Bloque 9',   4400.00, '2019-09-10', 1, 6, 2),
(72, 'Fabian',    'Aguilar Soria',  '9890123', '1993-05-28', N'Mampostería',            '75777777', 'fa.agu@const.com',   N'Av. Heroínas 200',     4250.00, '2021-07-25', 1, 6, 2),
(73, 'German',    'Vega Mamani',    '9901234', '1986-10-11', 'Revoque y enlucido',      '75888888', 'ge.veg@const.com',   'Calle Baptista 400',    4350.00, '2018-11-12', 1, 6, 2),
(74, 'Hernan',    'Torrico Paz',    '9012345', '1991-02-24', N'Albañilería general',    '75999999', 'he.tor@const.com',   'Zona Sur Av. 9',        4150.00, '2020-05-07', 1, 6, 2),
(75, 'Ivan',      'Flores Condori', '9123456', '1989-07-07', N'Mampostería y acabados', '76011111', 'iv.flo@const.com',   N'Av. Ballivián 200',    4500.00, '2019-12-22', 1, 6, 2),
(76, 'Julian',    'Cruz Mamani',    '9234568', '1994-11-20', N'Albañilería',            '76122222', 'ju.cru@const.com',   'Calle Sucre 300',       4200.00, '2022-04-08', 1, 6, 2),
(77, 'Kevin',     'Quispe Flores',  '9345679', '1987-04-03', 'Revoque y tarrajeo',      '76233333', 'ke.quis@const.com',  N'Av. América 400',      4350.00, '2019-10-25', 1, 6, 2),
(78, 'Leonel',    'Torrez Vega',    '9456780', '1992-08-16', N'Mampostería fina',       '76344444', 'le.tor@const.com',   'Calle Lanza 500',       4400.00, '2021-02-11', 1, 6, 2),
(79, 'Manuel',    'Aguilar Cruz',   '9567891', '1985-12-29', 'Acabados y revestidos',   '76455555', 'ma.agu@const.com',   'Zona Norte Bloque 10',  4600.00, '2018-06-28', 1, 6, 2),
(80, 'Nicolas',   'Soria Mamani',   '9678902', '1990-05-12', N'Albañilería general',    '76566666', 'ni.sor@const.com',   N'Av. Heroínas 300',     4250.00, '2020-09-14', 1, 6, 2),
(81, 'Oscar',     'Paz Torrico',    '9789013', '1988-09-25', N'Mampostería',            '76677777', 'os.paz@const.com',   'Calle Baptista 500',    4300.00, '2019-03-31', 1, 6, 2),
(82, 'Pablo',     'Condori Flores', '9890124', '1993-01-08', 'Revoque y enlucido',      '76788888', 'pa.con@const.com',   'Zona Sur Bloque 10',    4150.00, '2021-11-17', 1, 6, 2),
(83, 'Quirino',   'Mamani Cruz',    '9901235', '1986-06-21', N'Albañilería',            '76899999', 'qi.mam@const.com',   N'Av. Ballivián 400',    4450.00, '2018-04-03', 1, 6, 2),
(84, 'Ramiro',    'Vega Quispe',    '9012346', '1991-10-04', N'Mampostería y acabados', '76911110', 'ra.veg@const.com',   'Calle Sucre 500',       4500.00, '2020-12-19', 1, 6, 2),
(85, 'Sergio',    'Torrez Aguilar', '9123457', '1989-02-17', N'Albañilería general',    '77022221', 'se.tor@const.com',   N'Av. América 600',      4200.00, '2019-08-05', 1, 6, 2),
(86, 'Tomas',     'Flores Lima',    '9234569', '1994-07-01', 'Revoque y tarrajeo',      '77133332', 'to.flo@const.com',   'Calle Lanza 700',       4300.00, '2022-06-22', 1, 6, 2),
(87, 'Ulises',    'Cruz Torrico',   '9345670', '1987-11-14', N'Mampostería fina',       '77244443', 'ul.cru@const.com',   'Zona Norte Bloque 11',  4350.00, '2019-12-09', 1, 6, 2),
(88, 'Valentin',  'Quispe Soria',   '9456781', '1992-03-27', 'Acabados y revestidos',   '77355554', 'va.quis@const.com',  N'Av. Heroínas 400',     4100.00, '2021-09-25', 1, 6, 2),
(89, 'Wilber',    'Aguilar Mamani', '9567892', '1985-08-10', N'Albañilería',            '77466665', 'wi.agu@const.com',   'Calle Baptista 600',    4600.00, '2018-01-12', 1, 6, 2),
(90, 'Xavier',    'Soria Paz',      '9678903', '1990-12-23', N'Mampostería',            '77577776', 'xa.sor@const.com',   'Zona Sur Av. 11',       4250.00, '2020-07-29', 1, 6, 2),
(91, 'Yandel',    'Torrico Vega',   '9789014', '1988-04-06', 'Revoque y enlucido',      '77688887', 'ya.tor@const.com',   N'Av. Ballivián 600',    4400.00, '2019-02-14', 1, 6, 2),
(92, 'Zenon',     'Condori Cruz',   '9890125', '1993-08-19', N'Albañilería general',    '77799998', 'ze.con@const.com',   'Calle Sucre 700',       4150.00, '2021-10-01', 1, 6, 2),
(93, 'Abdon',     'Mamani Flores',  '9901236', '1986-01-02', N'Mampostería y acabados', '77811109', 'ab.mam@const.com',   N'Av. América 800',      4500.00, '2018-08-18', 1, 6, 2),
(94, 'Benigno',   'Vega Torrez',    '9012347', '1991-05-15', N'Albañilería',            '77922220', 'be.veg@const.com',   'Calle Lanza 900',       4300.00, '2020-03-04', 1, 6, 2),
(95, 'Cirilo',    'Quispe Aguilar', '9123458', '1989-09-28', 'Revoque y tarrajeo',      '78033331', 'ci.quis@const.com',  'Zona Norte Av. 5',      4200.00, '2019-11-20', 1, 6, 2),
(96, 'Dionisio',  'Torrez Mamani',  '9234570', '1994-02-11', N'Mampostería fina',       '78144442', 'dio.tor@const.com',  N'Av. Heroínas 500',     4350.00, '2022-08-07', 1, 6, 2),
(97, 'Elias',     'Flores Paz',     '9345671', '1987-06-24', 'Acabados y revestidos',   '78255553', 'el.flo@const.com',   'Calle Baptista 700',    4450.00, '2019-04-23', 1, 6, 2),
(98, 'Filiberto', 'Cruz Soria',     '9456782', '1992-10-07', N'Albañilería general',    '78366664', 'fi.cru@const.com',   'Zona Sur Bloque 11',    4100.00, '2021-12-10', 1, 6, 2),
(99, 'Gregorio',  'Aguilar Vega',   '9567893', '1985-02-20', N'Mampostería',            '78477775', 'gr.agu@const.com',   N'Av. Ballivián 800',    4600.00, '2018-05-27', 1, 6, 2),
(100,'Hilarion',  'Soria Condori',  '9678904', '1990-07-03', 'Revoque y enlucido',      '78588886', 'hi.sor@const.com',   'Calle Sucre 900',       4250.00, '2020-10-13', 1, 6, 2),
(101,'Isidoro',   'Torrico Torrez', '9789015', '1988-11-16', N'Albañilería',            '78699997', 'is.tor@const.com',   N'Av. América 1000',     4350.00, '2019-07-30', 1, 6, 2),
(102,'Jacinto',   'Mamani Quispe',  '9890126', '1993-03-29', N'Mampostería y acabados', '78811108', 'ja.mam@const.com',   'Calle Lanza 1100',      4500.00, '2021-05-15', 1, 6, 2),
(103,'Klever',    'Vega Flores',    '9901237', '1986-08-12', N'Albañilería general',    '78922219', 'kl.veg@const.com',   'Zona Norte Bloque 12',  4200.00, '2018-02-01', 1, 6, 2),
(104,'Laureano',  'Cruz Mamani',    '9012348', '1991-12-25', 'Revoque y tarrajeo',      '79033330', 'la.cru@const.com',   N'Av. Heroínas 600',     4300.00, '2020-06-18', 1, 6, 2),
(105,'Macedonio', 'Quispe Torrez',  '9123459', '1989-04-08', N'Mampostería fina',       '79144441', 'mac.quis@const.com', 'Calle Baptista 800',    4150.00, '2019-10-05', 1, 6, 2);

-- Contadores (idCargo=7, idDepartamento=4)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(106,'Carmen Rosa', 'Gutierrez Paz', '1956712', '1992-07-22', 'Contabilidad',            '74055555', 'c.gut@const.com',  'Calle Hamiraya 400',   8000.00, '2019-04-20', 1, 7, 4),
(107,'Elena',       'Rojas Mamani',  '1067823', '1988-11-08', 'Contabilidad Financiera', '74066667', 'e.roj@const.com',  N'Av. América 700',     7800.00, '2018-09-15', 1, 7, 4),
(108,'Fernanda',    'Paz Condori',   '1178934', '1994-03-25', N'Auditoría',              '74077778', 'fe.paz@const.com', 'Calle Lanza 800',      7600.00, '2021-01-30', 1, 7, 4),
(109,'Gloria',      'Mendez Flores', '1289045', '1990-08-12', 'Contabilidad',            '74088889', 'gl.men@const.com', 'Zona Norte Bloque 13', 7900.00, '2020-06-17', 1, 7, 4),
(110,'Hilda',       'Quispe Cruz',   '1390156', '1986-12-29', 'Finanzas',                '74099990', 'hi.qui@const.com', N'Av. Heroínas 1100',   8200.00, '2017-11-04', 1, 7, 4);

-- Asistentes Administrativos (idCargo=8, idDepartamento=1)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(111,'Rosa',    'Perez Alvarado', '2401234', '1995-09-05', N'Administración',     '76077777', 'r.per@const.com',  'Calle Punata 600',   5500.00, '2021-02-15', 1, 8, 1),
(112,'Sandra',  'Torrez Lima',    '2512345', '1993-01-18', 'Secretariado',        '76088888', 's.tor@const.com',  N'Av. Ballivián 700', 5300.00, '2020-08-02', 1, 8, 1),
(113,'Teresa',  'Aguilar Soria',  '2623456', '1997-05-31', N'Administración',     '76099999', 'te.agu@const.com', 'Calle Sucre 800',    5200.00, '2022-03-19', 1, 8, 1),
(114,'Ursula',  'Lima Mamani',    '2734567', '1994-10-14', N'Gestión Documental', '76111110', 'ur.lim@const.com', N'Av. América 900',   5400.00, '2021-09-05', 1, 8, 1),
(115,'Vanessa', 'Salinas Flores', '2845678', '1996-02-27', N'Administración',     '76122221', 'va.sal@const.com', 'Calle Lanza 1000',   5100.00, '2022-11-22', 1, 8, 1);

-- Plomeros (idCargo=9, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(116,'Juan',     'Perez Mamani',   '3677881', '1991-02-14', 'Instalaciones sanitarias', '77666666', 'j.per@const.com',   'Calle Oquendo 400',    4800.00, '2020-05-10', 1, 9, 2),
(117,'Luis',     'Garcia Flores',  '3788992', '1989-08-25', N'Tuberías y desagüe',      '77777777', 'l.gar@const.com',   N'Av. America 500',     4500.00, '2019-03-15', 1, 9, 2),
(118,'Mario',    'Suarez Quispe',  '3899003', '1993-11-30', N'Plomería general',        '77888888', 'ma.sua@const.com',  'Zona Sur Calle 3',     4600.00, '2021-07-01', 1, 9, 2),
(119,'Norberto', 'Choque Torrez',  '3900114', '1986-04-07', 'Instalaciones sanitarias', '77999999', 'no.cho@const.com',  N'Av. Heroínas 700',    4700.00, '2018-10-18', 1, 9, 2),
(120,'Oswaldo',  'Lima Aguilar',   '4011225', '1994-08-20', N'Tuberías y desagüe',      '78111110', 'os.lim@const.com',  'Calle Baptista 800',   4400.00, '2022-01-05', 1, 9, 2),
(121,'Porfirio', 'Vega Mamani',    '4122336', '1988-01-03', N'Plomería general',        '78222221', 'po.veg@const.com',  'Zona Norte Bloque 14', 4850.00, '2019-08-22', 1, 9, 2),
(122,'Quintin',  'Flores Cruz',    '4233447', '1991-05-16', 'Instalaciones sanitarias', '78333332', 'qi.flo@const.com',  N'Av. Ballivián 1200',  4550.00, '2020-12-09', 1, 9, 2),
(123,'Rufino',   'Torrico Soria',  '4344558', '1985-09-29', N'Tuberías PVC',            '78444443', 'ru.tor@const.com',  'Calle Sucre 1300',     4750.00, '2018-04-26', 1, 9, 2),
(124,'Salvador', 'Quispe Paz',     '4455669', '1993-02-12', N'Plomería general',        '78555554', 'sa.quis@const.com', N'Av. América 1400',    4650.00, '2021-10-13', 1, 9, 2),
(125,'Trifon',   'Condori Vega',   '4566770', '1987-06-25', 'Instalaciones sanitarias', '78666665', 'tr.con@const.com',  'Calle Lanza 1500',     4800.00, '2019-05-30', 1, 9, 2),
(126,'Ubaldo',   'Mamani Flores',  '4677881', '1995-10-08', N'Tuberías y desagüe',      '78777776', 'ub.mam@const.com',  'Zona Sur Bloque 12',   4350.00, '2022-03-16', 1, 9, 2),
(127,'Vidal',    'Cruz Torrez',    '4788992', '1989-02-21', N'Plomería general',        '78888887', 'vi.cru@const.com',  N'Av. Heroínas 800',    4700.00, '2020-09-02', 1, 9, 2),
(128,'Wilfredo', 'Aguilar Mamani', '4899003', '1992-07-04', 'Instalaciones sanitarias', '78999998', 'wi.agu2@const.com', 'Calle Baptista 900',   4450.00, '2021-04-19', 1, 9, 2),
(129,'Xiomara',  'Soria Quispe',   '4900114', '1986-11-17', N'Tuberías y desagüe',      '79111109', 'xi.sor@const.com',  'Zona Norte Bloque 15', 4600.00, '2018-12-06', 1, 9, 2),
(130,'Yolanda',  'Torrico Lima',   '5011225', '1994-03-30', N'Plomería general',        '79222220', 'yo.tor@const.com',  N'Av. Ballivián 1400',  4500.00, '2022-07-23', 1, 9, 2),
(131,'Zunilda',  'Paz Flores',     '5122336', '1988-08-13', 'Instalaciones sanitarias', '79333331', 'zu.paz@const.com',  'Calle Sucre 1500',     4750.00, '2020-02-09', 1, 9, 2),
(132,'Adolfo',   'Vega Condori',   '5233447', '1991-12-26', N'Tuberías PVC',            '79444442', 'ad.veg@const.com',  N'Av. América 1600',    4650.00, '2021-08-26', 1, 9, 2),
(133,'Bernabe',  'Flores Torrez',  '5344558', '1985-04-09', N'Plomería general',        '79555553', 'be.flo@const.com',  'Calle Lanza 1700',     4800.00, '2018-07-13', 1, 9, 2),
(134,'Cornelio', 'Quispe Aguilar', '5455669', '1993-08-22', 'Instalaciones sanitarias', '79666664', 'co.quis@const.com', 'Zona Sur Bloque 13',   4550.00, '2021-12-30', 1, 9, 2),
(135,'Demetrio', 'Condori Mamani', '5566770', '1987-01-05', N'Tuberías y desagüe',      '79777775', 'de.con@const.com',  N'Av. Heroínas 900',    4700.00, '2019-06-17', 1, 9, 2);

-- Soldadores (idCargo=10, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(136,'Eloy',     'Mamani Soria',  '6677881', '1988-03-15', 'Soldadura MIG/TIG',    '80111111', 'el.mam@const.com',  'Calle Punata 1000',    5500.00, '2019-04-01', 1, 10, 2),
(137,'Filemon',  'Cruz Vega',     '6788992', '1985-07-28', 'Soldadura industrial', '80222222', 'fi.cru@const.com',  N'Av. Ballivián 1600',  5300.00, '2018-10-18', 1, 10, 2),
(138,'Genaro',   'Quispe Lima',   '6899003', '1992-12-11', 'Soldadura al arco',    '80333333', 'ge.qui@const.com',  'Calle Sucre 1700',     5600.00, '2021-05-05', 1, 10, 2),
(139,'Hipolito', 'Torrez Mamani', '6900114', '1986-04-24', 'Soldadura MIG/TIG',    '80444444', 'hi.tor@const.com',  N'Av. América 1800',    5400.00, '2018-11-22', 1, 10, 2),
(140,'Ignacio',  'Aguilar Flores','7011225', '1994-09-06', 'Soldadura industrial', '80555555', 'ig.agu@const.com',  'Calle Lanza 1800',     5200.00, '2022-02-08', 1, 10, 2),
(141,'Jacinto2', 'Soria Condori', '7122336', '1989-01-19', 'Soldadura al arco',    '80666666', 'jac.sor@const.com', 'Zona Norte Bloque 16', 5700.00, '2020-08-25', 1, 10, 2),
(142,'Kristian', 'Paz Torrico',   '7233447', '1991-05-02', 'Soldadura MIG/TIG',    '80777777', 'kr.paz@const.com',  N'Av. Heroínas 1000',   5500.00, '2021-03-12', 1, 10, 2),
(143,'Lorenzo',  'Vega Quispe',   '7344558', '1984-09-15', 'Soldadura industrial', '80888888', 'lo.veg@const.com',  'Calle Baptista 1200',  5800.00, '2017-10-29', 1, 10, 2),
(144,'Macedon2', 'Flores Torrez', '7455669', '1993-01-28', 'Soldadura al arco',    '80999999', 'mac.flo@const.com', 'Zona Sur Bloque 14',   5300.00, '2022-07-15', 1, 10, 2),
(145,'Narciso',  'Condori Cruz',  '7566770', '1987-06-11', 'Soldadura MIG/TIG',    '81111110', 'na.con@const.com',  N'Av. Ballivián 1800',  5600.00, '2019-01-02', 1, 10, 2);

-- Carpinteros (idCargo=11, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(146,'Obdulio',    'Mamani Vega',    '8677881', '1986-04-24', N'Carpintería de obra',    '82111111', 'ob.mam@const.com',  'Calle Sucre 1900',     5000.00, '2018-05-10', 1, 11, 2),
(147,'Primitivo',  'Cruz Soria',     '8788992', '1990-08-06', N'Carpintería fina',       '82222222', 'pr.cru@const.com',  N'Av. América 2000',    4800.00, '2020-12-27', 1, 11, 2),
(148,'Quiliano',   'Quispe Flores',  '8899003', '1993-12-19', N'Carpintería de obra',    '82333333', 'qi.qui@const.com',  'Calle Lanza 2000',     4900.00, '2022-08-13', 1, 11, 2),
(149,'Rosendo',    'Torrez Paz',     '8900114', '1984-04-01', 'Encofrado y apuntalado',  '82444444', 'ro.tor@const.com',  'Zona Norte Av. 6',     5200.00, '2017-02-28', 1, 11, 2),
(150,'Sebastian2', 'Aguilar Mamani', '9011225', '1991-08-14', N'Carpintería de obra',    '82555555', 'seb.agu@const.com', N'Av. Heroínas 1100',   5100.00, '2021-06-15', 1, 11, 2),
(151,'Timoteo',    'Soria Vega',     '9122336', '1988-12-27', N'Carpintería fina',       '82666666', 'ti.sor@const.com',  'Calle Baptista 1300',  4850.00, '2020-01-01', 1, 11, 2),
(152,'Urbano',     'Paz Cruz',       '9233447', '1995-05-10', N'Carpintería de obra',    '82777777', 'ur.paz@const.com',  'Zona Sur Bloque 15',   4700.00, '2022-10-18', 1, 11, 2),
(153,'Valentin2',  'Vega Quispe',    '9344558', '1983-09-23', 'Encofrado y apuntalado',  '82888888', 'val.veg@const.com', N'Av. Ballivián 2000',  5300.00, '2016-07-05', 1, 11, 2),
(154,'Wenceslao',  'Flores Mamani',  '9455669', '1990-02-05', N'Carpintería fina',       '82999999', 'we.flo@const.com',  'Calle Sucre 2100',     5000.00, '2020-04-22', 1, 11, 2),
(155,'Ygnacio',    'Condori Torrez', '9566770', '1987-06-18', N'Carpintería de obra',    '83111110', 'yg.con@const.com',  N'Av. América 2200',    4900.00, '2019-11-08', 1, 11, 2);

-- Pintores (idCargo=12, idDepartamento=2)
INSERT INTO dbo.empleado (idEmpleado, nombre, apellido, ci, fechaNacimiento, especialidad, numCelular, email, direccion, salario, fechaContratacion, idEstadoEmpleado, idCargo, idDepartamento) VALUES
(156,'Zenobio',      'Mamani Cruz',    '1677881', '1989-07-31', 'Pintura de interiores', '84111111', 'ze.mam@const.com', 'Calle Lanza 2100',      4200.00, '2019-08-17', 1, 12, 2),
(157,'Abundio',      'Vega Soria',     '1788992', '1993-12-14', 'Pintura exterior',      '84222222', 'ab.veg@const.com', 'Zona Norte Bloque 17',  4100.00, '2022-04-03', 1, 12, 2),
(158,'Baldomero',    'Flores Paz',     '1899003', '1986-04-27', 'Pintura industrial',    '84333333', 'ba.flo@const.com', N'Av. Heroínas 1200',    4500.00, '2018-11-19', 1, 12, 2),
(159,'Casimiro',     'Torrez Aguilar', '1900114', '1991-09-10', 'Pintura de interiores', '84444444', 'ca.tor@const.com', 'Calle Baptista 1400',   4300.00, '2021-06-06', 1, 12, 2),
(160,'Delfino',      'Quispe Mamani',  '2011225', '1988-01-23', 'Pintura exterior',      '84555555', 'de.qui@const.com', 'Zona Sur Bloque 16',    4400.00, '2019-12-23', 1, 12, 2),
(161,'Eulogio',      'Condori Vega',   '2122336', '1994-06-06', 'Pintura industrial',    '84666666', 'eu.con@const.com', N'Av. Ballivián 2200',   4150.00, '2022-07-10', 1, 12, 2),
(162,'Filomeno',     'Soria Flores',   '2233447', '1985-10-19', 'Pintura de interiores', '84777777', 'fi.sor@const.com', 'Calle Sucre 2300',      4600.00, '2017-04-27', 1, 12, 2),
(163,'Gumercindo',   'Paz Torrez',     '2344558', '1990-03-02', 'Pintura exterior',      '84888888', 'gu.paz@const.com', N'Av. América 2400',     4250.00, '2020-11-13', 1, 12, 2),
(164,'Hermenegildo', 'Cruz Quispe',    '2455669', '1987-07-15', 'Pintura industrial',    '84999999', 'he.cru@const.com', 'Calle Lanza 2400',      4350.00, '2019-05-30', 1, 12, 2),
(165,'Inocencio',    'Mamani Aguilar', '2566770', '1993-11-28', 'Pintura de interiores', '85111110', 'in.mam@const.com', 'Zona Norte Bloque 18',  4200.00, '2022-02-14', 1, 12, 2);

SET IDENTITY_INSERT dbo.empleado OFF;
GO

-- =====================================================
-- GRUPO 6: PROYECTOS
-- =====================================================

SET IDENTITY_INSERT dbo.proyecto ON;
INSERT INTO dbo.proyecto (idProyecto, nombreProyecto, descripcion, idTipoProyecto, ubicacion, fechaInicio, fechaFinEstimada, fechaFinReal, idEstadoProyecto, idCliente) VALUES
(1,  'Residencia Mendoza',               N'Casa de dos plantas con jardín',         1, 'Urb. Las Brisas',         '2024-01-10', '2024-08-10', NULL,         2,  1),
(2,  'Edificio Los Andes',               N'Edificio de 6 pisos 24 departamentos',   2, N'Av. América 789',        '2023-06-01', '2025-06-01', NULL,         2,  4),
(3,  N'Local Fernández',                 N'Local comercial 120 m²',                 5, 'Calle Sucre 456',         '2024-03-15', '2024-07-15', '2024-07-20', 3,  2),
(4,  N'Pavimentación Zona Norte',        N'Pavimentación 2km carretera vecinal',    3, 'Zona Norte Cochabamba',   '2023-09-01', '2024-03-01', '2024-03-15', 3,  3),
(5,  N'Ampliación Salinas',              N'Ampliación y refacción vivienda',        1, 'Calle Baptista 321',      '2024-05-01', '2024-10-01', NULL,         2,  5),
(6,  'Construccion Casa Familiar Norte', N'Casa familiar zona norte',               1, 'Zona Norte Cochabamba',   '2025-11-01', '2026-06-01', NULL,         2, 20),
(7,  'Edificio Residencial Sur',         N'Edificio 4 pisos zona sur',              2, 'Zona Sur Cochabamba',     '2026-02-01', '2027-02-01', NULL,         1,  3),
(8,  'Centro Comercial Oeste',           N'Centro comercial 2000 m²',               5, 'Av. Blanco Galindo Km 6', '2025-03-01', '2026-03-01', NULL,         2,  6),
(9,  N'Puente Río Rocha',               N'Puente peatonal sobre río Rocha',        4, N'Río Rocha Sector Norte', '2024-08-01', '2025-02-01', '2025-02-20', 3,  8),
(10, 'Vivienda Social Zona Sur',         N'Conjunto habitacional 20 unidades',      1, 'Zona Sur Cochabamba',     '2025-06-01', '2026-12-01', NULL,         2, 12);
SET IDENTITY_INSERT dbo.proyecto OFF;
GO

-- =====================================================
-- GRUPO 7: PROVEEDOR MATERIAL
-- =====================================================

SET IDENTITY_INSERT dbo.proveedormaterial ON;
INSERT INTO dbo.proveedormaterial (idProveedorMaterial, idProveedor, idMaterial, precioProveedor, tiempoEntrega) VALUES
(1,  1,  1,  55.00, 2), (2,  1, 10,  85.00, 2), (3,  1, 11,   2.20, 1),
(4,  2,  2,   8.00, 3), (5,  2,  3,   5.00, 3), (6,  2, 12,   6.50, 3),
(7,  3,  4,  32.00, 5), (8,  3, 13,  16.00, 5),
(9,  4,  5,  82.00, 7), (10, 4, 14,  23.00, 4),
(11, 5,  6,  75.00, 1), (12, 5,  7,  90.00, 1),
(13, 6,  8,  42.00, 3), (14, 6, 15,  52.00, 3),
(15, 7,  9,  62.00, 4),
(16, 8,  1,  57.00, 1), (17, 8,  2,   8.30, 2),
(18, 9,  6,  78.00, 2), (19, 9, 11,   2.40, 1),
(20,10,  4,  34.00, 4), (21,10,  7,  93.00, 2);
SET IDENTITY_INSERT dbo.proveedormaterial OFF;
GO

-- =====================================================
-- GRUPO 8: CONTRATOS Y COTIZACIONES
-- =====================================================

SET IDENTITY_INSERT dbo.contrato ON;
INSERT INTO dbo.contrato (idContrato, numeroContrato, idTipoContrato, fechaContrato, fechaFirma, fechaInicio, fechaVencimiento, montoTotal, idEstadoContrato, idProyecto) VALUES
(1, 'CONT-2024-001', 1, '2023-12-20', '2024-01-05', '2024-01-10', '2024-08-10',  185000.00, 1, 1),
(2, 'CONT-2023-002', 2, '2023-05-15', '2023-05-25', '2023-06-01', '2025-06-01',  920000.00, 1, 2),
(3, 'CONT-2024-003', 1, '2024-03-01', '2024-03-10', '2024-03-15', '2024-07-15',   95000.00, 2, 3),
(4, 'CONT-2023-004', 1, '2023-08-20', '2023-08-28', '2023-09-01', '2024-03-01',  320000.00, 2, 4),
(5, 'CONT-2024-005', 3, '2024-04-20', '2024-04-28', '2024-05-01', '2024-10-01',   75000.00, 1, 5),
(6, 'CONT-2025-006', 1, '2025-10-15', '2025-10-25', '2025-11-01', '2026-06-01',  150000.00, 1, 6),
(7, 'CONT-2025-007', 2, '2025-01-10', '2025-01-20', '2025-03-01', '2026-03-01',  850000.00, 1, 8),
(8, 'CONT-2024-008', 1, '2024-07-15', '2024-07-25', '2024-08-01', '2025-02-01',  280000.00, 2, 9),
(9, 'CONT-2025-009', 2, '2025-05-01', '2025-05-10', '2025-06-01', '2026-12-01',  450000.00, 1, 10);
SET IDENTITY_INSERT dbo.contrato OFF;
GO

SET IDENTITY_INSERT dbo.cotizacioncliente ON;
INSERT INTO dbo.cotizacioncliente (idCotizacionCliente, numeroCotizacionCliente, fechaCotizacion, fechaValidez, observaciones, idProyecto, idEstadoCotizacion) VALUES
(1, 'COT-CLI-2023-001', '2023-12-01', '2023-12-31', N'Incluye materiales y mano de obra', 1, 2),
(2, 'COT-CLI-2023-002', '2023-05-01', '2023-05-20', N'Precio por etapas',                 2, 2),
(3, 'COT-CLI-2024-003', '2024-02-20', '2024-03-05', N'Precio fijo todo incluido',         3, 2),
(4, 'COT-CLI-2023-004', '2023-08-10', '2023-08-25', N'Incluye señalización y compactación',4,2),
(5, 'COT-CLI-2024-005', '2024-04-10', '2024-04-25', N'Solo mano de obra',                 5, 2),
(6, 'COT-CLI-2025-006', '2025-10-01', '2025-10-31', N'Cotización pendiente de respuesta', 5, 1),
(7, 'COT-CLI-2025-007', '2025-11-15', '2025-12-15', N'Cliente evaluando propuesta',       1, 1),
(8, 'COT-CLI-2025-008', '2025-02-01', '2025-02-28', N'Cotización centro comercial',       8, 2),
(9, 'COT-CLI-2024-009', '2024-07-01', '2024-07-20', N'Cotización puente peatonal',        9, 2);
SET IDENTITY_INSERT dbo.cotizacioncliente OFF;
GO

SET IDENTITY_INSERT dbo.cotizacioninterna ON;
INSERT INTO dbo.cotizacioninterna (idCotizacionInterna, numeroCotizacionInterna, fechaCotizacion, observaciones, idProyecto, idEstadoCotizacion) VALUES
(1, 'COT-INT-2023-001', '2023-11-25', N'Costo real estimado proyecto Mendoza',   1, 2),
(2, 'COT-INT-2023-002', '2023-04-28', N'Costo real estimado edificio Los Andes', 2, 2),
(3, 'COT-INT-2024-003', '2024-02-18', N'Costo real estimado local Fernández',    3, 2),
(4, 'COT-INT-2023-004', '2023-08-08', N'Costo real estimado pavimentación',      4, 2),
(5, 'COT-INT-2024-005', '2024-04-08', N'Costo real estimado ampliación Salinas', 5, 2),
(6, 'COT-INT-2026-006', '2026-01-15', N'Costo interno edificio sur',             7, 1),
(7, 'COT-INT-2025-007', '2025-02-01', N'Costo interno centro comercial',         8, 2),
(8, 'COT-INT-2024-008', '2024-07-01', N'Costo interno puente Rocha',             9, 2);
SET IDENTITY_INSERT dbo.cotizacioninterna OFF;
GO

-- =====================================================
-- GRUPO 9: ÓRDENES DE COMPRA Y DETALLE
-- =====================================================

SET IDENTITY_INSERT dbo.ordencompra ON;
INSERT INTO dbo.ordencompra (idOrdenCompra, fechaOrden, idEstadoOrden, idProveedor, montoTotal) VALUES
(1,  '2024-01-15', 2, 1,  8700.00),
(2,  '2024-01-20', 2, 2, 15300.00),
(3,  '2024-03-10', 1, 5,  4750.00),
(4,  '2024-06-01', 2, 1,  5800.00),
(5,  '2024-05-10', 1, 3,  2100.00),
(6,  '2025-11-05', 2, 1, 12000.00),
(7,  '2025-11-10', 2, 2, 18500.00),
(8,  '2025-03-01', 2, 6,  8000.00),
(9,  '2024-08-05', 2, 5,  9500.00),
(10, '2025-06-01', 1, 4,  6500.00);
SET IDENTITY_INSERT dbo.ordencompra OFF;
GO

SET IDENTITY_INSERT dbo.detallecompra ON;
INSERT INTO dbo.detallecompra (idDetalleCompra, idOrdenCompra, idMaterial, cantidad, precioUnitario) VALUES
(1,  1,  1,  150.00, 55.00), (2,  1,  6,   10.00, 75.00),
(3,  2,  2,  800.00,  8.00), (4,  2,  3,  500.00,  5.00),
(5,  3,  7,   50.00, 95.00),
(6,  4,  1,  100.00, 58.00),
(7,  5,  4,   60.00, 35.00),
(8,  6,  1,  200.00, 55.00), (9,  6, 11, 1000.00,  2.20),
(10, 7,  2, 1200.00,  8.00), (11, 7, 12,  800.00,  6.50),
(12, 8,  8,  150.00, 42.00), (13, 8, 15,  100.00, 52.00),
(14, 9,  6,  100.00, 75.00), (15, 9,  7,   50.00, 90.00),
(16,10,  5,   40.00, 82.00), (17,10, 14,  100.00, 23.00);
SET IDENTITY_INSERT dbo.detallecompra OFF;
GO

-- =====================================================
-- GRUPO 10: ASIGNACIÓN EMPLEADOS A PROYECTOS
-- =====================================================

SET IDENTITY_INSERT dbo.empleadoproyecto ON;
INSERT INTO dbo.empleadoproyecto (idEmpleadoProyecto, idEmpleado, idProyecto, idRolProyecto, fechaInicio, fechaFin) VALUES
(1,  1,  1, 1, '2024-01-10', NULL),    (2,  6,  1, 2, '2024-01-10', NULL),
(3,  16, 1, 3, '2024-01-10', NULL),    (4,  31, 1, 4, '2024-01-10', NULL),
(5,  32, 1, 4, '2024-01-10', NULL),    (6,  1,  2, 1, '2023-06-01', NULL),
(7,  7,  2, 2, '2023-06-01', NULL),    (8,  17, 2, 3, '2023-06-01', NULL),
(9,  26, 2, 4, '2023-06-01', NULL),    (10, 27, 2, 4, '2023-06-01', NULL),
(11, 28, 2, 4, '2023-06-01', NULL),    (12, 2,  3, 1, '2024-03-15', '2024-07-20'),
(13, 8,  3, 2, '2024-03-15', '2024-07-20'), (14, 18, 3, 3, '2024-03-15', '2024-07-20'),
(15, 33, 3, 4, '2024-03-15', '2024-07-20'), (16, 3,  4, 1, '2023-09-01', '2024-03-15'),
(17, 9,  4, 2, '2023-09-01', '2024-03-15'), (18, 19, 4, 3, '2023-09-01', '2024-03-15'),
(19, 1,  6, 1, '2025-11-01', NULL),    (20, 6,  6, 2, '2025-11-01', NULL),
(21, 20, 6, 3, '2025-11-01', NULL),    (22, 34, 6, 4, '2025-11-01', NULL),
(23, 35, 6, 4, '2025-11-01', NULL),    (24, 36, 6, 4, '2025-11-01', NULL);
SET IDENTITY_INSERT dbo.empleadoproyecto OFF;
GO

-- =====================================================
-- GRUPO 11: MATERIALES POR PROYECTO
-- =====================================================

SET IDENTITY_INSERT dbo.materialproyecto ON;
INSERT INTO dbo.materialproyecto (idMaterialProyecto, idProyecto, idMaterial, cantidadUtilizada, fechaRegistro, costoTotal) VALUES
(1,  1,  1,   150.00, '2024-01-20',  8700.00),
(2,  1,  2,  1200.00, '2024-01-20', 10200.00),
(3,  1,  6,    80.00, '2024-02-01',  6400.00),
(4,  2,  1,   800.00, '2023-07-01', 46400.00),
(5,  2,  2,  5000.00, '2023-07-01', 42500.00),
(6,  2,  9,  1200.00, '2023-08-01', 78000.00),
(7,  3,  1,    80.00, '2024-03-20',  4640.00),
(8,  3,  8,   200.00, '2024-06-01',  9000.00),
(9,  4,  6,   500.00, '2023-09-10', 40000.00),
(10, 4,  7,   400.00, '2023-09-10', 38000.00),
(11, 6,  1,   200.00, '2025-11-10', 11600.00),
(12, 6,  2,  1500.00, '2025-11-10', 12750.00),
(13, 6, 11,  2000.00, '2025-11-15',  5000.00),
(14, 8,  9,   800.00, '2025-03-10', 52000.00),
(15, 8,  8,   300.00, '2025-04-01', 13500.00);
SET IDENTITY_INSERT dbo.materialproyecto OFF;
GO

-- =====================================================
-- GRUPO 12: DETALLE COTIZACIONES
-- =====================================================

SET IDENTITY_INSERT dbo.detallecotizacioncliente ON;
INSERT INTO dbo.detallecotizacioncliente (idDetalleCotizacionCliente, idCotizacionCliente, concepto, descripcion, cantidad, precioUnitario) VALUES
(1,  1, N'Cimentación',   N'Excavación y losa de cimentación',       1.00,  25000.00),
(2,  1, 'Estructura',     N'Columnas, vigas y losa de entrepiso',    1.00,  55000.00),
(3,  1, N'Mampostería',   N'Muros de ladrillo visto',                1.00,  40000.00),
(4,  1, 'Instalaciones',  N'Eléctricas y sanitarias',                1.00,  30000.00),
(5,  1, 'Acabados',       N'Pisos, pintura y puertas',               1.00,  35000.00),
(6,  2, 'Etapa 1',        N'Excavación y sótano',                    1.00, 150000.00),
(7,  2, 'Etapa 2',        N'Estructura hormigón armado 6 pisos',     1.00, 400000.00),
(8,  2, 'Etapa 3',        N'Acabados, instalaciones y exteriores',   1.00, 370000.00),
(9,  3, 'Obra gruesa',    N'Cimentación, estructura y muros',        1.00,  55000.00),
(10, 3, 'Acabados',       N'Pisos, pintura y carpintería',           1.00,  40000.00),
(11, 8, N'Cimentación',   N'Excavación y fundaciones',               1.00, 120000.00),
(12, 8, 'Estructura',     N'Estructura metálica y losas',            1.00, 350000.00),
(13, 8, 'Acabados',       N'Fachada, interiores y exteriores',       1.00, 380000.00);
SET IDENTITY_INSERT dbo.detallecotizacioncliente OFF;
GO

SET IDENTITY_INSERT dbo.detallecotizacioninterna ON;
INSERT INTO dbo.detallecotizacioninterna (idDetalleCotizacionInterna, idCotizacionInterna, idMaterial, cantidadEstimada, costoUnitarioEstimado) VALUES
(1,  1,  1,  150.00, 55.00), (2,  1,  2, 1200.00,  8.00),
(3,  1,  6,   80.00, 75.00), (4,  1,  7,   60.00, 90.00),
(5,  2,  1,  800.00, 55.00), (6,  2,  2, 5000.00,  8.00),
(7,  2,  9, 1200.00, 62.00),
(8,  3,  1,   80.00, 55.00), (9,  3,  8,  200.00, 42.00),
(10, 4,  6,  500.00, 75.00), (11, 4,  7,  400.00, 90.00),
(12, 7,  9,  800.00, 62.00), (13, 7,  8,  300.00, 42.00),
(14, 8,  2, 2000.00,  8.00), (15, 8, 12, 1000.00,  6.50);
SET IDENTITY_INSERT dbo.detallecotizacioninterna OFF;
GO

SET IDENTITY_INSERT dbo.detallecotizacionmanoobra ON;
INSERT INTO dbo.detallecotizacionmanoobra (idDetalleManoObra, idCotizacionInterna, idCargo, cantidadPersonas, horasEstimadas, pagoPorHora, totalEstimado) VALUES
(1,  1, 2, 2, 320.00, 20.00,  12800.00), (2,  1, 4, 1, 200.00, 35.00,   7000.00),
(3,  1, 5, 1, 100.00, 25.00,   2500.00), (4,  1, 6, 3, 480.00, 15.00,  21600.00),
(5,  2, 2, 4, 960.00, 20.00,  76800.00), (6,  2, 4, 2, 640.00, 35.00,  44800.00),
(7,  2, 3, 2, 480.00, 40.00,  38400.00), (8,  2, 6, 8,1920.00, 15.00, 230400.00),
(9,  3, 2, 1, 160.00, 20.00,   3200.00), (10, 3, 6, 2, 320.00, 15.00,   9600.00),
(11, 4, 2, 2, 480.00, 20.00,  19200.00), (12, 4, 6, 4, 960.00, 15.00,  57600.00),
(13, 5, 2, 1, 120.00, 20.00,   2400.00), (14, 5, 6, 2, 240.00, 15.00,   7200.00),
(15, 6, 2, 2, 200.00, 20.00,   8000.00), (16, 6, 6, 3, 300.00, 15.00,  13500.00),
(17, 6, 9, 1, 150.00, 17.00,   2550.00);
SET IDENTITY_INSERT dbo.detallecotizacionmanoobra OFF;
GO

-- =====================================================
-- GRUPO 13: CUOTAS
-- =====================================================

SET IDENTITY_INSERT dbo.cuota ON;
INSERT INTO dbo.cuota (idCuota, idContrato, numeroCuota, fechaVencimiento, montoCuota, saldoPendiente, idEstadoPago) VALUES
(1,  1, 1, '2024-02-10',  37000.00,     0.00, 3),
(2,  1, 2, '2024-04-10',  37000.00,     0.00, 3),
(3,  1, 3, '2024-06-10',  37000.00, 37000.00, 1),
(4,  1, 4, '2024-08-10',  74000.00, 74000.00, 1),
(5,  2, 1, '2023-09-01', 184000.00,     0.00, 3),
(6,  2, 2, '2024-01-01', 184000.00,     0.00, 3),
(7,  2, 3, '2024-07-01', 184000.00,184000.00, 1),
(8,  2, 4, '2025-01-01', 184000.00,184000.00, 1),
(9,  2, 5, '2025-06-01', 184000.00,184000.00, 1),
(10, 3, 1, '2024-05-15',  47500.00,     0.00, 3),
(11, 3, 2, '2024-07-20',  47500.00,     0.00, 3),
(12, 4, 1, '2023-12-01',  96000.00,     0.00, 3),
(13, 4, 2, '2024-03-01', 224000.00,     0.00, 3),
(14, 5, 1, '2024-07-01',  37500.00,     0.00, 3),
(15, 5, 2, '2024-10-01',  37500.00, 37500.00, 1),
(16, 6, 1, '2026-01-01',  50000.00,     0.00, 3),
(17, 6, 2, '2026-03-01',  50000.00, 50000.00, 1),
(18, 6, 3, '2026-06-01',  50000.00, 50000.00, 1),
(19, 7, 1, '2025-06-01', 212500.00,     0.00, 3),
(20, 7, 2, '2025-12-01', 212500.00,212500.00, 1),
(21, 7, 3, '2026-06-01', 212500.00,212500.00, 1),
(22, 7, 4, '2026-12-01', 212500.00,212500.00, 1),
(23, 8, 1, '2024-10-01', 140000.00,     0.00, 3),
(24, 8, 2, '2025-02-01', 140000.00,     0.00, 3),
(25, 9, 1, '2025-09-01', 150000.00,     0.00, 3),
(26, 9, 2, '2026-03-01', 150000.00,150000.00, 1),
(27, 9, 3, '2026-09-01', 150000.00,150000.00, 1);
SET IDENTITY_INSERT dbo.cuota OFF;
GO

-- =====================================================
-- GRUPO 14: PAGOS
-- =====================================================

SET IDENTITY_INSERT dbo.pagocliente ON;
INSERT INTO dbo.pagocliente (idPagoCliente, idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago) VALUES
(1,  1,  1,  '2024-02-08',  37000.00, 1, 3),
(2,  1,  2,  '2024-04-09',  37000.00, 1, 3),
(3,  2,  5,  '2023-08-30', 184000.00, 1, 3),
(4,  2,  6,  '2023-12-28', 184000.00, 2, 3),
(5,  3,  10, '2024-05-14',  47500.00, 3, 3),
(6,  3,  11, '2024-07-19',  47500.00, 1, 3),
(7,  4,  12, '2023-11-28',  96000.00, 1, 3),
(8,  4,  13, '2024-02-28', 224000.00, 2, 3),
(9,  5,  14, '2024-06-30',  37500.00, 1, 3),
(10, 6,  16, '2025-12-28',  50000.00, 1, 3),
(11, 7,  19, '2025-05-28', 212500.00, 2, 3),
(12, 8,  23, '2024-09-28', 140000.00, 1, 3),
(13, 8,  24, '2025-01-28', 140000.00, 1, 3),
(14, 9,  25, '2025-08-28', 150000.00, 3, 3);
SET IDENTITY_INSERT dbo.pagocliente OFF;
GO

SET IDENTITY_INSERT dbo.pagoproveedor ON;
INSERT INTO dbo.pagoproveedor (idPagoProveedor, idProveedor, fechaPago, monto, idMetodoPago, factura) VALUES
(1, 1, '2024-01-18',  8700.00, 1, 'FAC-FANC-00123'),
(2, 2, '2024-01-25', 15300.00, 1, 'FAC-ACER-00456'),
(3, 5, '2024-03-15',  4750.00, 3, 'FAC-ARID-00789'),
(4, 1, '2024-06-05',  5800.00, 1, 'FAC-FANC-00234'),
(5, 3, '2024-05-15',  2100.00, 2, 'FAC-PINE-00101'),
(6, 1, '2025-11-08', 12000.00, 1, 'FAC-FANC-00345'),
(7, 2, '2025-11-15', 18500.00, 1, 'FAC-ACER-00567'),
(8, 6, '2025-03-05',  8000.00, 2, 'FAC-PINR-00234'),
(9, 5, '2024-08-10',  9500.00, 1, 'FAC-ARID-00890');
SET IDENTITY_INSERT dbo.pagoproveedor OFF;
GO

-- =====================================================
-- GRUPO 15: REGISTRO DE HORAS TRABAJADAS
-- =====================================================

SET IDENTITY_INSERT dbo.registrohoras ON;
INSERT INTO dbo.registrohoras (idRegistroHoras, idEmpleado, idProyecto, fecha, horasTrabajadas, pagoPorHora, totalPago) VALUES
(1,  31, 1, '2024-01-15', 8.00, 20.00, 160.00),
(2,  31, 1, '2024-01-16', 8.00, 20.00, 160.00),
(3,  31, 1, '2024-01-17', 8.00, 20.00, 160.00),
(4,  32, 1, '2024-01-15', 8.00, 15.00, 120.00),
(5,  32, 1, '2024-01-16', 8.00, 15.00, 120.00),
(6,  32, 1, '2024-01-17', 8.00, 15.00, 120.00),
(7,  34, 6, '2026-01-05', 8.00, 20.00, 160.00),
(8,  34, 6, '2026-01-06', 8.00, 20.00, 160.00),
(9,  34, 6, '2026-01-07', 8.00, 20.00, 160.00),
(10, 34, 6, '2026-01-08', 8.00, 20.00, 160.00),
(11, 35, 6, '2026-01-05', 8.00, 15.00, 120.00),
(12, 35, 6, '2026-01-06', 8.00, 15.00, 120.00),
(13, 35, 6, '2026-01-07', 8.00, 15.00, 120.00),
(14, 35, 6, '2026-01-08', 8.00, 15.00, 120.00),
(15, 36, 6, '2026-01-05', 8.00, 18.00, 144.00),
(16, 36, 6, '2026-01-06', 8.00, 18.00, 144.00),
(17, 36, 6, '2026-01-12', 8.00, 18.00, 144.00),
(18, 37, 6, '2026-01-05', 8.00, 22.00, 176.00),
(19, 37, 6, '2026-01-06', 8.00, 22.00, 176.00),
(20, 37, 6, '2026-01-13', 8.00, 22.00, 176.00),
(21, 38, 6, '2026-01-07', 8.00, 16.00, 128.00),
(22, 38, 6, '2026-01-08', 8.00, 16.00, 128.00),
(23, 38, 6, '2026-01-14', 8.00, 16.00, 128.00),
(24, 96, 6, '2026-01-05', 8.00, 20.00, 160.00),
(25, 96, 6, '2026-01-06', 8.00, 20.00, 160.00),
(26, 96, 6, '2026-01-07', 8.00, 20.00, 160.00),
(27, 96, 6, '2026-01-08', 8.00, 20.00, 160.00),
(28, 97, 6, '2026-01-05', 8.00, 15.00, 120.00),
(29, 97, 6, '2026-01-06', 8.00, 15.00, 120.00),
(30, 97, 6, '2026-01-07', 8.00, 15.00, 120.00),
(31, 97, 6, '2026-01-08', 8.00, 15.00, 120.00),
(32, 98, 6, '2026-01-05', 8.00, 17.00, 136.00),
(33, 98, 6, '2026-01-06', 8.00, 17.00, 136.00),
(34, 98, 6, '2026-01-09', 8.00, 17.00, 136.00);
SET IDENTITY_INSERT dbo.registrohoras OFF;
GO

-- =====================================================
-- GRUPO 16: INVENTARIO
-- =====================================================

SET IDENTITY_INSERT dbo.inventario ON;
INSERT INTO dbo.inventario (idInventario, idMaterial, stockActual, stockMinimo, ubicacion, fechaActualizacion) VALUES
(1,   1,  500.00, 100.00, 'Bodega Central Estante A1',   '2026-01-01'),
(2,   2, 2000.00, 500.00, 'Bodega Central Estante B1',   '2026-01-01'),
(3,   3, 1500.00, 300.00, 'Bodega Central Estante B2',   '2026-01-01'),
(4,   4,  200.00,  50.00, 'Bodega Madera Estante C1',    '2026-01-01'),
(5,   5,   30.00,  10.00, N'Bodega Eléctrica Estante D1','2026-01-01'),
(6,   6,  300.00,  80.00, 'Bodega Central Estante A2',   '2026-01-01'),
(7,   7,  250.00,  80.00, 'Bodega Central Estante A3',   '2026-01-01'),
(8,   8,  100.00,  20.00, 'Bodega Pintura Estante E1',   '2026-01-01'),
(9,   9,  800.00, 200.00, 'Bodega Central Estante F1',   '2026-01-01'),
(10, 10,   50.00,  10.00, 'Bodega Central Estante A4',   '2026-01-01'),
(11, 11, 5000.00,1000.00, 'Bodega Central Estante G1',   '2026-01-01'),
(12, 12, 3000.00, 500.00, 'Bodega Central Estante B3',   '2026-01-01'),
(13, 13,  800.00, 100.00, 'Bodega Madera Estante C2',    '2026-01-01'),
(14, 14,  400.00,  50.00, N'Bodega Plomería Estante H1', '2026-01-01'),
(15, 15,  150.00,  30.00, 'Bodega Pintura Estante E2',   '2026-01-01');
SET IDENTITY_INSERT dbo.inventario OFF;
GO

-- GRUPO 17: BONIFICACIÓN Y PAGO PLANILLA
-- NOTA: tipoBonificacion ENUM → NVARCHAR con CHECK
--       gestion YEAR → SMALLINT (usar valor numérico directo)
SET IDENTITY_INSERT dbo.bonificacionempleado ON;
INSERT INTO dbo.bonificacionempleado (idBonificacion, idEmpleado, tipoBonificacion, aniosAntiguedad, porcentajeBono, salarioBase, gestion, descripcion, idEstadoPago) VALUES
(1, 1,   N'Antigüedad', 15,  25.00, 15000.00, 2025, N'Bono antigüedad más de 10 años', 3),
(2, 6,   N'Aguinaldo',  NULL,100.00,10000.00, 2025, N'Aguinaldo anual completo',        3),
(3, 16,  N'Antigüedad',  8,  15.00,  9000.00, 2025, N'Bono antigüedad 6 a 10 años',    1),
(4, 26,  N'Aguinaldo',  NULL,100.00, 4500.00, 2025, N'Aguinaldo anual',                 3),
(5, 31,  N'Antigüedad',  6,  10.00,  4500.00, 2025, N'Bono antigüedad 3 a 5 años',     1),
(6, 96,  N'Aguinaldo',  NULL,100.00, 4800.00, 2025, N'Aguinaldo anual',                 3),
(7, 97,  N'Legal',       5,   8.00,  4500.00, 2025, N'Beneficio normativa interna',     2),
(8, 36,  N'Antigüedad',  4,   5.00,  4600.00, 2025, N'Bono antigüedad 1 a 2 años',     1);
SET IDENTITY_INSERT dbo.bonificacionempleado OFF;
GO

SET IDENTITY_INSERT dbo.pagoplanilla ON;
INSERT INTO dbo.pagoplanilla (idPagoPlanilla, idEmpleado, idBonificacion, fechaPago, monto, idMetodoPago, idEstadoPago) VALUES
(1, 1,  1, '2025-12-15', 3750.00, 1, 3),
(2, 6,  2, '2025-12-20',10000.00, 2, 3),
(3, 26, 4, '2025-12-20', 4500.00, 1, 3),
(4, 96, 6, '2025-12-20', 4800.00, 1, 3),
(5, 97, 7, '2025-11-30',  360.00, 1, 2);
SET IDENTITY_INSERT dbo.pagoplanilla OFF;
GO
-- Reactivar todos los constraints
EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO
-- VERIFICACIÓN FINAL
SELECT 'Empleado'     AS Tabla, COUNT(*) AS Total FROM dbo.empleado      UNION ALL
SELECT 'Cliente',               COUNT(*)           FROM dbo.cliente       UNION ALL
SELECT 'Proyecto',              COUNT(*)           FROM dbo.proyecto      UNION ALL
SELECT 'Contrato',              COUNT(*)           FROM dbo.contrato      UNION ALL
SELECT 'RegistroHoras',         COUNT(*)           FROM dbo.registrohoras UNION ALL
SELECT 'Albañiles', COUNT(*) FROM dbo.empleado e JOIN dbo.cargo c ON e.idCargo = c.idCargo WHERE c.nombreCargo = N'Albañil' UNION ALL
SELECT 'Plomeros',  COUNT(*) FROM dbo.empleado e JOIN dbo.cargo c ON e.idCargo = c.idCargo WHERE c.nombreCargo = 'Plomero';
GO
