// ─────────────────────────────────────────────────────────────────────────────
// Módulo 10 — Reportes / Buscador General.
// Endpoints "agregadores" que cruzan varios módulos en una sola respuesta:
//   GET /api/reportes/resumen            → tarjetas con totales del sistema
//   GET /api/reportes/buscar?q=&tipo=    → buscador global (proyecto/empleado/
//                                          material/cliente) por id, nombre, etc.
//   GET /api/reportes/empleado/:id       → ficha completa del empleado + pagos
//                                          pendientes (planilla)
// El expediente de proyecto se sirve desde /api/proyectos/:id/reporte (ya existe).
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

const num = n => Number(Number(n || 0).toFixed(2));

// ── Resumen para las tarjetas del panel del módulo ──────────────────────────
router.get('/resumen', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM dbo.proyecto) AS totalProyectos,
                (SELECT COUNT(*) FROM dbo.proyecto p
                   JOIN dbo.estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
                   WHERE ep.nombreEstadoProyecto = 'En ejecución') AS proyectosActivos,
                (SELECT COUNT(*) FROM dbo.empleado) AS totalEmpleados,
                (SELECT COUNT(*) FROM dbo.material) AS totalMateriales,
                (SELECT ISNULL(SUM(mp.costoTotal), 0) FROM dbo.materialproyecto mp) AS valorMateriales,
                (SELECT ISNULL(SUM(ppp.montoPagado), 0)
                   FROM dbo.pagoplanillaproyecto ppp
                   JOIN dbo.estadopago ep ON ppp.idEstadoPago = ep.idEstadoPago
                   WHERE ep.nombreEstadoPago = 'Pendiente') AS planillaPendiente,
                (SELECT ISNULL(SUM(pc.monto), 0)
                   FROM dbo.pagocliente pc
                   JOIN dbo.estadopago ep ON pc.idEstadoPago = ep.idEstadoPago
                   WHERE ep.nombreEstadoPago = 'Pendiente') AS pagosClientePendiente
        `);
        const row = r.recordset[0] || {};
        res.json({
            totalProyectos: row.totalProyectos || 0,
            proyectosActivos: row.proyectosActivos || 0,
            totalEmpleados: row.totalEmpleados || 0,
            totalMateriales: row.totalMateriales || 0,
            valorMateriales: num(row.valorMateriales),
            planillaPendiente: num(row.planillaPendiente),
            pagosClientePendiente: num(row.pagosClientePendiente),
            totalPendiente: num((row.planillaPendiente || 0) + (row.pagosClientePendiente || 0)),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Buscador global ─────────────────────────────────────────────────────────
// Busca por id o por nombre en proyectos, empleados, materiales y clientes.
// ?q = texto, ?tipo = (opcional) limita a un solo tipo.
router.get('/buscar', async (req, res) => {
    const q = (req.query.q || '').trim();
    const tipo = (req.query.tipo || '').trim();
    if (!q) return res.json([]);
    const quiere = t => !tipo || tipo === t;
    try {
        const pool = await sql.connect(config);
        const like = `%${q}%`;
        const resultados = [];

        if (quiere('proyecto')) {
            const r = await pool.request().input('q', sql.NVarChar, like).query(`
                SELECT TOP 8 p.idProyecto AS id, p.nombreProyecto AS titulo,
                       ep.nombreEstadoProyecto AS estado,
                       LTRIM(RTRIM(cl.nombre + ' ' + ISNULL(cl.apellido, ''))) AS cliente
                FROM dbo.proyecto p
                JOIN dbo.estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
                LEFT JOIN dbo.cliente cl ON p.idCliente = cl.idCliente
                WHERE p.nombreProyecto LIKE @q OR CAST(p.idProyecto AS NVARCHAR) LIKE @q
                ORDER BY p.nombreProyecto
            `);
            r.recordset.forEach(x => resultados.push({
                tipo: 'proyecto', id: x.id, titulo: x.titulo,
                subtitulo: [x.estado, x.cliente].filter(Boolean).join(' · '),
            }));
        }

        if (quiere('empleado')) {
            const r = await pool.request().input('q', sql.NVarChar, like).query(`
                SELECT TOP 8 e.idEmpleado AS id, e.nombre + ' ' + e.apellido AS titulo,
                       c.nombreCargo AS cargo, ee.nombreEstadoEmpleado AS estado
                FROM dbo.empleado e
                JOIN dbo.cargo c ON e.idCargo = c.idCargo
                JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
                WHERE e.nombre LIKE @q OR e.apellido LIKE @q
                   OR (e.nombre + ' ' + e.apellido) LIKE @q
                   OR e.ci LIKE @q OR CAST(e.idEmpleado AS NVARCHAR) LIKE @q
                ORDER BY e.nombre, e.apellido
            `);
            r.recordset.forEach(x => resultados.push({
                tipo: 'empleado', id: x.id, titulo: x.titulo,
                subtitulo: [x.cargo, x.estado].filter(Boolean).join(' · '),
            }));
        }

        if (quiere('material')) {
            const r = await pool.request().input('q', sql.NVarChar, like).query(`
                SELECT TOP 8 m.idMaterial AS id, m.nombreMaterial AS titulo,
                       um.nombreUnidadMedida AS unidad, m.precioUnitario AS precio
                FROM dbo.material m
                LEFT JOIN dbo.unidadmedida um ON m.idUnidadMedida = um.idUnidadMedida
                WHERE m.nombreMaterial LIKE @q OR CAST(m.idMaterial AS NVARCHAR) LIKE @q
                ORDER BY m.nombreMaterial
            `);
            r.recordset.forEach(x => resultados.push({
                tipo: 'material', id: x.id, titulo: x.titulo,
                subtitulo: [x.unidad, x.precio != null ? `Bs ${num(x.precio)}` : null].filter(Boolean).join(' · '),
            }));
        }

        if (quiere('cliente')) {
            const r = await pool.request().input('q', sql.NVarChar, like).query(`
                SELECT TOP 8 c.idCliente AS id,
                       LTRIM(RTRIM(c.nombre + ' ' + ISNULL(c.apellido, ''))) AS titulo,
                       tc.nombreTipoCliente AS tipoCliente, c.documentoID AS documento
                FROM dbo.cliente c
                LEFT JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
                WHERE c.nombre LIKE @q OR c.apellido LIKE @q OR c.documentoID LIKE @q OR CAST(c.idCliente AS NVARCHAR) LIKE @q
                ORDER BY c.nombre, c.apellido
            `);
            r.recordset.forEach(x => resultados.push({
                tipo: 'cliente', id: x.id, titulo: x.titulo,
                subtitulo: [x.tipoCliente, x.documento].filter(Boolean).join(' · '),
            }));
        }

        res.json(resultados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Ficha completa de un empleado ───────────────────────────────────────────
// Datos personales + asignaciones a proyectos + horas + pagos de planilla
// (con el total pendiente claramente separado).
router.get('/empleado/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { desde, hasta } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de empleado inválido' });
    try {
        const pool = await sql.connect(config);
        const conRango = () => pool.request()
            .input('id', sql.Int, id)
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null);

        const datos = await pool.request().input('id', sql.Int, id).query(`
            SELECT e.idEmpleado, e.nombre, e.apellido, e.ci, e.email, e.numCelular,
                   e.direccion, e.fechaContratacion, e.fechaNacimiento, e.especialidad,
                   e.salarioReferencial, c.nombreCargo, c.pagoPorHora,
                   d.nombreDepartamento, ee.nombreEstadoEmpleado
            FROM dbo.empleado e
            JOIN dbo.cargo c ON e.idCargo = c.idCargo
            JOIN dbo.departamento d ON e.idDepartamento = d.idDepartamento
            JOIN dbo.estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
            WHERE e.idEmpleado = @id
        `);
        if (datos.recordset.length === 0)
            return res.status(404).json({ error: 'Empleado no encontrado' });

        const asignaciones = await pool.request().input('id', sql.Int, id).query(`
            SELECT p.nombreProyecto, rp.nombreRolProyecto, ep.fechaInicio, ep.fechaFin,
                   CASE WHEN ep.fechaFin IS NULL OR ep.fechaFin > CAST(GETDATE() AS DATE)
                        THEN 'Activo' ELSE 'Finalizado' END AS estado
            FROM dbo.empleadoproyecto ep
            JOIN dbo.proyecto p ON ep.idProyecto = p.idProyecto
            JOIN dbo.rolproyecto rp ON ep.idRolProyecto = rp.idRolProyecto
            WHERE ep.idEmpleado = @id
            ORDER BY ep.fechaInicio DESC
        `);

        const horas = await conRango().query(`
            SELECT rh.fecha, rh.horasTrabajadas, p.nombreProyecto, c.pagoPorHora,
                   (rh.horasTrabajadas * c.pagoPorHora) AS totalPago
            FROM dbo.registrohoras rh
            JOIN dbo.empleado e ON rh.idEmpleado = e.idEmpleado
            JOIN dbo.cargo c ON e.idCargo = c.idCargo
            JOIN dbo.proyecto p ON rh.idProyecto = p.idProyecto
            WHERE rh.idEmpleado = @id
              AND (@desde IS NULL OR rh.fecha >= @desde)
              AND (@hasta IS NULL OR rh.fecha <= @hasta)
            ORDER BY rh.fecha DESC
        `);

        const pagos = await conRango().query(`
            SELECT p.nombreProyecto, ppp.fechaPago, ppp.montoPagado,
                   mp.nombreMetodoPago, est.nombreEstadoPago
            FROM dbo.pagoplanillaproyecto ppp
            JOIN dbo.proyecto p ON ppp.idProyecto = p.idProyecto
            JOIN dbo.metodopago mp ON ppp.idMetodoPago = mp.idMetodoPago
            JOIN dbo.estadopago est ON ppp.idEstadoPago = est.idEstadoPago
            WHERE ppp.idEmpleado = @id
              AND (@desde IS NULL OR ppp.fechaPago >= @desde)
              AND (@hasta IS NULL OR ppp.fechaPago <= @hasta)
            ORDER BY ppp.fechaPago DESC
        `);

        const totalHoras = horas.recordset.reduce((s, h) => s + Number(h.horasTrabajadas || 0), 0);
        const totalGanado = horas.recordset.reduce((s, h) => s + Number(h.totalPago || 0), 0);
        const pendientes = pagos.recordset.filter(p => p.nombreEstadoPago === 'Pendiente');
        const totalPagado = pagos.recordset
            .filter(p => p.nombreEstadoPago !== 'Pendiente' && p.nombreEstadoPago !== 'Anulado')
            .reduce((s, p) => s + Number(p.montoPagado || 0), 0);
        const totalPendiente = pendientes.reduce((s, p) => s + Number(p.montoPagado || 0), 0);

        res.json({
            empleado: datos.recordset[0],
            asignaciones: asignaciones.recordset,
            horas: horas.recordset,
            pagos: pagos.recordset,
            totales: {
                totalHoras: num(totalHoras),
                totalGanado: num(totalGanado),
                totalPagado: num(totalPagado),
                totalPendiente: num(totalPendiente),
                cantidadPendientes: pendientes.length,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Ficha de un material ────────────────────────────────────────────────────
// Datos del material + en qué proyectos se usó (cantidades y costos).
router.get('/material/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { desde, hasta } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de material inválido' });
    try {
        const pool = await sql.connect(config);

        const datos = await pool.request().input('id', sql.Int, id).query(`
            SELECT m.idMaterial, m.nombreMaterial, m.descripcion, m.precioUnitario,
                   um.nombreUnidadMedida
            FROM dbo.material m
            LEFT JOIN dbo.unidadmedida um ON m.idUnidadMedida = um.idUnidadMedida
            WHERE m.idMaterial = @id
        `);
        if (datos.recordset.length === 0)
            return res.status(404).json({ error: 'Material no encontrado' });

        const usos = await pool.request()
            .input('id', sql.Int, id)
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT p.nombreProyecto, mp.cantidadUtilizada, mp.costoTotal, mp.fechaRegistro
            FROM dbo.materialproyecto mp
            JOIN dbo.proyecto p ON mp.idProyecto = p.idProyecto
            WHERE mp.idMaterial = @id
              AND (@desde IS NULL OR mp.fechaRegistro >= @desde)
              AND (@hasta IS NULL OR mp.fechaRegistro <= @hasta)
            ORDER BY mp.fechaRegistro DESC
        `);

        const totalCantidad = usos.recordset.reduce((s, u) => s + Number(u.cantidadUtilizada || 0), 0);
        const totalCosto = usos.recordset.reduce((s, u) => s + Number(u.costoTotal || 0), 0);
        res.json({
            material: datos.recordset[0],
            usos: usos.recordset,
            totales: {
                proyectos: usos.recordset.length,
                totalCantidad: num(totalCantidad),
                totalCosto: num(totalCosto),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Ficha de un cliente ─────────────────────────────────────────────────────
// Datos del cliente + sus proyectos + contratos.
router.get('/cliente/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { desde, hasta } = req.query;
    if (!id) return res.status(400).json({ error: 'ID de cliente inválido' });
    try {
        const pool = await sql.connect(config);
        const conRango = () => pool.request()
            .input('id', sql.Int, id)
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null);

        const datos = await pool.request().input('id', sql.Int, id).query(`
            SELECT c.idCliente, c.nombre, c.apellido, c.documentoID, c.email, c.numCelular,
                   c.direccion, c.fechaRegistro, tc.nombreTipoCliente
            FROM dbo.cliente c
            LEFT JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
            WHERE c.idCliente = @id
        `);
        if (datos.recordset.length === 0)
            return res.status(404).json({ error: 'Cliente no encontrado' });

        const proyectos = await conRango().query(`
            SELECT p.nombreProyecto, ep.nombreEstadoProyecto, p.fechaInicio, p.fechaFinEstimada
            FROM dbo.proyecto p
            JOIN dbo.estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
            WHERE p.idCliente = @id
              AND (@desde IS NULL OR p.fechaInicio >= @desde)
              AND (@hasta IS NULL OR p.fechaInicio <= @hasta)
            ORDER BY p.fechaInicio DESC
        `);

        const contratos = await conRango().query(`
            SELECT ct.numeroContrato, p.nombreProyecto, ct.fechaFirma, ct.montoTotal,
                   ec.nombreEstadoContrato
            FROM dbo.contrato ct
            JOIN dbo.proyecto p ON ct.idProyecto = p.idProyecto
            JOIN dbo.estadocontrato ec ON ct.idEstadoContrato = ec.idEstadoContrato
            WHERE p.idCliente = @id
              AND (@desde IS NULL OR ct.fechaFirma >= @desde)
              AND (@hasta IS NULL OR ct.fechaFirma <= @hasta)
            ORDER BY ct.fechaFirma DESC
        `);

        const totalContratos = contratos.recordset.reduce((s, c) => s + Number(c.montoTotal || 0), 0);
        res.json({
            cliente: datos.recordset[0],
            proyectos: proyectos.recordset,
            contratos: contratos.recordset,
            totales: {
                proyectos: proyectos.recordset.length,
                contratos: contratos.recordset.length,
                montoContratos: num(totalContratos),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
