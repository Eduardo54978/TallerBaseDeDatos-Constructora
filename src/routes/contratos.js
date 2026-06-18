const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`SELECT TOP 10 c.idContrato, c.numeroContrato, p.nombreProyecto, LTRIM(RTRIM(cl.nombre + ' ' + ISNULL(cl.apellido, ''))) AS nombreCliente, c.numeroContrato + ' — ' + p.nombreProyecto + ' (' + LTRIM(RTRIM(cl.nombre + ' ' + ISNULL(cl.apellido, ''))) + ')' AS display FROM dbo.contrato c JOIN dbo.proyecto p ON c.idProyecto = p.idProyecto JOIN dbo.cliente cl ON p.idCliente = cl.idCliente WHERE c.numeroContrato LIKE @q OR p.nombreProyecto LIKE @q OR cl.nombre LIKE @q OR cl.apellido LIKE @q OR CAST(c.idContrato AS NVARCHAR) LIKE @q ORDER BY c.numeroContrato`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET preparación de contrato para un proyecto ────────────────────────────
// Devuelve la cotización cliente asociada (con su monto total y estado), y el
// detalle de la obra: materiales a comprar y personal asignado, con costos, que
// avalan el costo total. El frontend usa esto al elegir el proyecto.
router.get('/proyecto/:idProyecto/preparacion', async (req, res) => {
    const id = Number(req.params.idProyecto);
    if (!id) return res.status(400).json({ error: 'Proyecto inválido' });
    const n = v => Number(Number(v || 0).toFixed(2));
    try {
        const pool = await sql.connect(config);

        // Cotización cliente del proyecto: se prioriza la Aprobada, luego la más reciente.
        const cot = await pool.request().input('id', sql.Int, id).query(`
            SELECT TOP 1
                cc.numeroCotizacionCliente AS numero,
                ec.nombreEstadoCotizacion  AS estado,
                cc.fechaCotizacion,
                ISNULL((SELECT SUM(dcc.cantidad * dcc.precioUnitario)
                        FROM dbo.detallecotizacioncliente dcc
                        WHERE dcc.idCotizacionCliente = cc.idCotizacionCliente), 0) AS total
            FROM dbo.cotizacioncliente cc
            JOIN dbo.estadocotizacion ec ON cc.idEstadoCotizacion = ec.idEstadoCotizacion
            WHERE cc.idProyecto = @id
            ORDER BY CASE WHEN ec.nombreEstadoCotizacion = 'Aprobada' THEN 0 ELSE 1 END,
                     cc.fechaCotizacion DESC
        `);

        const materiales = await pool.request().input('id', sql.Int, id).query(`
            SELECT m.nombreMaterial, mp.cantidadUtilizada, mp.costoTotal
            FROM dbo.materialproyecto mp
            JOIN dbo.material m ON mp.idMaterial = m.idMaterial
            WHERE mp.idProyecto = @id
            ORDER BY m.nombreMaterial
        `);

        const personal = await pool.request().input('id', sql.Int, id).query(`
            SELECT e.nombre + ' ' + e.apellido AS empleado, c.nombreCargo,
                   rp.nombreRolProyecto,
                   c.pagoPorHora * ISNULL((SELECT SUM(rh.horasTrabajadas)
                           FROM dbo.registrohoras rh
                           WHERE rh.idEmpleado = ep.idEmpleado AND rh.idProyecto = ep.idProyecto), 0) AS costo
            FROM dbo.empleadoproyecto ep
            JOIN dbo.empleado e ON ep.idEmpleado = e.idEmpleado
            JOIN dbo.cargo c ON e.idCargo = c.idCargo
            JOIN dbo.rolproyecto rp ON ep.idRolProyecto = rp.idRolProyecto
            WHERE ep.idProyecto = @id
            ORDER BY e.nombre, e.apellido
        `);

        const c = cot.recordset[0];
        const costoMaterial = materiales.recordset.reduce((s, x) => s + Number(x.costoTotal || 0), 0);
        const costoPersonal = personal.recordset.reduce((s, x) => s + Number(x.costo || 0), 0);

        res.json({
            cotizacion: c
                ? { existe: true, numero: c.numero, total: n(c.total),
                    estado: c.estado, aprobada: c.estado === 'Aprobada' }
                : { existe: false, aprobada: false },
            materiales: materiales.recordset,
            personal: personal.recordset,
            totales: {
                costoMaterial: n(costoMaterial),
                costoPersonal: n(costoPersonal),
                costoTotal: n(costoMaterial + costoPersonal),
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/tipos/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT idTipoContrato, nombreTipoContrato FROM dbo.tipocontrato ORDER BY nombreTipoContrato`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/estados/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT idEstadoContrato, nombreEstadoContrato FROM dbo.estadocontrato ORDER BY idEstadoContrato`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT
                c.idContrato, c.numeroContrato, c.fechaContrato, c.fechaInicio,
                c.fechaVencimiento, c.montoTotal, tc.nombreTipoContrato,
                ec.nombreEstadoContrato, p.nombreProyecto, LTRIM(RTRIM(cl.nombre + ' ' + ISNULL(cl.apellido, ''))) AS nombreCliente
            FROM dbo.contrato c
            JOIN dbo.tipocontrato   tc ON c.idTipoContrato   = tc.idTipoContrato
            JOIN dbo.estadocontrato ec ON c.idEstadoContrato = ec.idEstadoContrato
            JOIN dbo.proyecto       p  ON c.idProyecto       = p.idProyecto
            JOIN dbo.cliente        cl ON p.idCliente        = cl.idCliente
            WHERE (@desde IS NULL OR c.fechaContrato >= @desde)
              AND (@hasta IS NULL OR c.fechaContrato <= @hasta)
            ORDER BY c.fechaContrato DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ÔöÇÔöÇ GET contrato por id (Incluye sus cuotas) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        
        // 1. Obtener datos del contrato
        const resultContrato = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT c.*, tc.nombreTipoContrato, ec.nombreEstadoContrato, p.nombreProyecto, LTRIM(RTRIM(cl.nombre + ' ' + ISNULL(cl.apellido, ''))) AS nombreCliente
                FROM dbo.contrato c
                JOIN dbo.tipocontrato   tc ON c.idTipoContrato   = tc.idTipoContrato
                JOIN dbo.estadocontrato ec ON c.idEstadoContrato = ec.idEstadoContrato
                JOIN dbo.proyecto       p  ON c.idProyecto       = p.idProyecto
                JOIN dbo.cliente        cl ON p.idCliente        = cl.idCliente
                WHERE c.idContrato = @id
            `);
            
        if (resultContrato.recordset.length === 0)
            return res.status(404).json({ error: 'Contrato no encontrado' });

        // 2. Obtener lista de cuotas asociadas
        const resultCuotas = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT cu.idCuota, cu.numeroCuota, cu.montoCuota, cu.saldoPendiente, cu.fechaVencimiento, ep.nombreEstadoPago
                FROM dbo.cuota cu
                JOIN dbo.estadopago ep ON cu.idEstadoPago = ep.idEstadoPago
                WHERE cu.idContrato = @id
                ORDER BY cu.numeroCuota
            `);

        // Armar la respuesta completa
        const contratoCompleto = resultContrato.recordset[0];
        contratoCompleto.cuotas = resultCuotas.recordset;

        res.json(contratoCompleto);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ÔöÇÔöÇ GET contratos por idCliente ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.get('/cliente/:idCliente', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('idCliente', sql.Int, req.params.idCliente)
            .query(`
                SELECT 
                    c.idContrato, c.numeroContrato, c.montoTotal, c.fechaContrato, 
                    ec.nombreEstadoContrato, p.nombreProyecto
                FROM dbo.contrato c
                JOIN dbo.proyecto p ON c.idProyecto = p.idProyecto
                JOIN dbo.estadocontrato ec ON c.idEstadoContrato = ec.idEstadoContrato
                WHERE p.idCliente = @idCliente
                ORDER BY ec.nombreEstadoContrato, c.fechaContrato DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ÔöÇÔöÇ POST registrar contrato ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.post('/', async (req, res) => {
    const { idProyecto, idTipoContrato, numeroContrato, fechaContrato, fechaInicio, fechaVencimiento, fechaFirma, montoTotal } = req.body;

    if (!numeroContrato || !montoTotal || !idProyecto)
        return res.status(400).json({ error: 'Faltan datos obligatorios para el contrato' });

    try {
        const pool = await sql.connect(config);

        // Validar proyecto y tipo
        const proyExiste = await pool.request().input('id', sql.Int, idProyecto).query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0) return res.status(400).json({ error: 'Proyecto no existe' });

        // Regla de negocio: no se puede generar un contrato sin una cotización
        // cliente asociada al proyecto y en estado APROBADA.
        const cotAprobada = await pool.request()
            .input('id', sql.Int, idProyecto)
            .query(`
                SELECT TOP 1 cc.numeroCotizacionCliente
                FROM dbo.cotizacioncliente cc
                JOIN dbo.estadocotizacion ec ON cc.idEstadoCotizacion = ec.idEstadoCotizacion
                WHERE cc.idProyecto = @id AND ec.nombreEstadoCotizacion = 'Aprobada'
            `);
        if (cotAprobada.recordset.length === 0)
            return res.status(400).json({
                error: 'No se puede generar el contrato: el proyecto no tiene una cotización cliente en estado APROBADA.'
            });

        // Buscar estado "Vigente"
        const estadoVigente = await pool.request().query(`SELECT idEstadoContrato FROM dbo.estadocontrato WHERE nombreEstadoContrato = 'Vigente'`);
        const idEstado = estadoVigente.recordset.length > 0 ? estadoVigente.recordset[0].idEstadoContrato : 1;

        const result = await pool.request()
            .input('idProy',   sql.Int,      idProyecto)
            .input('idTipo',   sql.Int,      idTipoContrato)
            .input('idEstado', sql.Int,      idEstado)
            .input('num',      sql.NVarChar, numeroContrato)
            .input('fechaC',   sql.Date,     fechaContrato)
            .input('fechaI',   sql.Date,     fechaInicio      || null)
            .input('fechaV',   sql.Date,     fechaVencimiento || null)
            .input('fechaF',   sql.Date,     fechaFirma       || null)
            .input('monto',    sql.Decimal,  montoTotal)
            .query(`
                INSERT INTO dbo.contrato
                    (idProyecto, idTipoContrato, idEstadoContrato, numeroContrato, fechaContrato, fechaInicio, fechaVencimiento, fechaFirma, montoTotal)
                VALUES (@idProy, @idTipo, @idEstado, @num, @fechaC, @fechaI, @fechaV, @fechaF, @monto);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idContrato;
            `);
        res.status(201).json({ idContrato: result.recordset[0].idContrato, mensaje: 'Contrato creado con estado Vigente.' });
    } catch (err) {
    const detalle =
        err.originalError?.info?.message ||
        err.message ||
        'Error desconocido';

    console.error('BODY RECIBIDO EN /api/contratos:', req.body);
    console.error('ERROR REAL SQL:', detalle);

    res.status(400).json({
        error: errorAmigable(err),
        detalle: detalle
    });
}
});

// ÔöÇÔöÇ PUT actualizar estado de contrato ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.put('/:id/estado', async (req, res) => {
    const { idEstadoContrato } = req.body;
    try {
        const pool = await sql.connect(config);
        
        // Validar que el nuevo estado existe
        const estadoExiste = await pool.request().input('id', sql.Int, idEstadoContrato).query(`SELECT 1 FROM dbo.estadocontrato WHERE idEstadoContrato = @id`);
        if (estadoExiste.recordset.length === 0) return res.status(400).json({ error: 'Estado de contrato no v├ílido' });

        await pool.request()
            .input('idContrato', sql.Int, req.params.id)
            .input('idEstado',   sql.Int, idEstadoContrato)
            .query(`UPDATE dbo.contrato SET idEstadoContrato = @idEstado WHERE idContrato = @idContrato`);
            
        res.json({ mensaje: 'Estado del contrato actualizado correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ÔöÇÔöÇ POST generar cuotas para un contrato ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.post('/:id/cuotas', async (req, res) => {
    const { numeroCuotas, frecuenciaPago } = req.body; // frecuenciaPago: 'mensual', 'quincenal'
    const idContrato = req.params.id;

    if (!numeroCuotas || numeroCuotas <= 0) return res.status(400).json({ error: 'numeroCuotas debe ser mayor a 0' });

    try {
        const pool = await sql.connect(config);

        // 1. Obtener datos del contrato
        const contrato = await pool.request()
            .input('id', sql.Int, idContrato)
            .query(`SELECT montoTotal, fechaInicio FROM dbo.contrato WHERE idContrato = @id`);
            
        if (contrato.recordset.length === 0) return res.status(404).json({ error: 'Contrato no encontrado' });

        // Verificar si ya tiene cuotas
        const cuotasExistentes = await pool.request().input('id', sql.Int, idContrato).query(`SELECT 1 FROM dbo.cuota WHERE idContrato = @id`);
        if (cuotasExistentes.recordset.length > 0) return res.status(400).json({ error: 'Este contrato ya tiene cuotas generadas' });

        const montoTotal = contrato.recordset[0].montoTotal;
        const fechaBase = new Date(contrato.recordset[0].fechaInicio || Date.now());
        const montoCuota = (montoTotal / numeroCuotas).toFixed(2);
        
        // Asumimos que idEstadoPago = 1 es "Pendiente"
        const idEstadoPendiente = 1; 

        // Generar las cuotas e insertarlas (Bulk simplificado en iteraciones)
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            for (let i = 1; i <= numeroCuotas; i++) {
                // Calcular fecha de vencimiento seg├║n frecuencia
                let fechaVencimiento = new Date(fechaBase);
                if (frecuenciaPago === 'mensual') {
                    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
                } else if (frecuenciaPago === 'quincenal') {
                    fechaVencimiento.setDate(fechaVencimiento.getDate() + (15 * i));
                } else {
                    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i); // Default mensual
                }

                await request
                    .input(`idC_${i}`, sql.Int, idContrato)
                    .input(`numC_${i}`, sql.Int, i)
                    .input(`fVenc_${i}`, sql.Date, fechaVencimiento)
                    .input(`monto_${i}`, sql.Decimal(15,2), montoCuota)
                    .input(`estado_${i}`, sql.Int, idEstadoPendiente)
                    .query(`
                        INSERT INTO dbo.cuota (idContrato, numeroCuota, fechaVencimiento, montoCuota, saldoPendiente, idEstadoPago)
                        VALUES (@idC_${i}, @numC_${i}, @fVenc_${i}, @monto_${i}, @monto_${i}, @estado_${i})
                    `);
            }
            await transaction.commit();
            res.status(201).json({ mensaje: `${numeroCuotas} cuotas generadas exitosamente` });
        } catch (trxErr) {
            await transaction.rollback();
            throw trxErr;
        }

    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── PUT editar datos básicos del contrato (solo si está Vigente) ─────────────
router.put('/:id', async (req, res) => {
    const { numeroContrato, montoTotal, idTipoContrato } = req.body;

    if (!numeroContrato || !montoTotal || Number(montoTotal) <= 0 || !idTipoContrato)
        return res.status(400).json({ error: 'Número, monto (mayor a 0) y tipo son obligatorios' });

    try {
        const pool = await sql.connect(config);

        const actual = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT idEstadoContrato FROM dbo.contrato WHERE idContrato = @id`);
        if (actual.recordset.length === 0)
            return res.status(404).json({ error: 'Contrato no encontrado' });

        // estadocontrato: 1=Vigente, 2=Finalizado, 3=Rescindido
        if (actual.recordset[0].idEstadoContrato !== 1)
            return res.status(400).json({ error: 'Solo se puede editar un contrato Vigente. Para uno finalizado/rescindido use Rescindir/Renovar.' });

        const dup = await pool.request()
            .input('num', sql.NVarChar, numeroContrato)
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.contrato WHERE numeroContrato = @num AND idContrato <> @id`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'El número de contrato ya está en uso por otro contrato' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('num', sql.NVarChar, numeroContrato)
            .input('monto', sql.Decimal(15, 2), montoTotal)
            .input('idTipo', sql.Int, idTipoContrato)
            .query(`
                UPDATE dbo.contrato
                SET numeroContrato = @num, montoTotal = @monto, idTipoContrato = @idTipo
                WHERE idContrato = @id
            `);
        res.json({ mensaje: 'Contrato actualizado correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── POST rescindir contrato actual y crear uno nuevo (renovación) ────────────
router.post('/:id/rescindir-renovar', async (req, res) => {
    const { numeroContrato, montoTotal } = req.body;

    if (!numeroContrato || !montoTotal || Number(montoTotal) <= 0)
        return res.status(400).json({ error: 'Número de contrato y monto (mayor a 0) son obligatorios' });

    try {
        const pool = await sql.connect(config);

        const viejo = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT idProyecto, idTipoContrato, idEstadoContrato FROM dbo.contrato WHERE idContrato = @id`);
        if (viejo.recordset.length === 0)
            return res.status(404).json({ error: 'Contrato no encontrado' });

        const dup = await pool.request()
            .input('num', sql.NVarChar, numeroContrato)
            .query(`SELECT 1 FROM dbo.contrato WHERE numeroContrato = @num`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'El número del nuevo contrato ya existe' });

        const rescindido = await pool.request()
            .query(`SELECT idEstadoContrato FROM dbo.estadocontrato WHERE nombreEstadoContrato = 'Rescindido'`);
        const vigente = await pool.request()
            .query(`SELECT idEstadoContrato FROM dbo.estadocontrato WHERE nombreEstadoContrato = 'Vigente'`);
        if (rescindido.recordset.length === 0 || vigente.recordset.length === 0)
            return res.status(500).json({ error: 'Estados Rescindido/Vigente no configurados en BD' });

        // 1. Rescindir el contrato actual
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('estado', sql.Int, rescindido.recordset[0].idEstadoContrato)
            .query(`UPDATE dbo.contrato SET idEstadoContrato = @estado WHERE idContrato = @id`);

        // 2. Crear el nuevo contrato (mismo proyecto y tipo, nuevo número y monto)
        const nuevo = await pool.request()
            .input('idProy', sql.Int, viejo.recordset[0].idProyecto)
            .input('idTipo', sql.Int, viejo.recordset[0].idTipoContrato)
            .input('idEstado', sql.Int, vigente.recordset[0].idEstadoContrato)
            .input('num', sql.NVarChar, numeroContrato)
            .input('fechaC', sql.Date, new Date().toISOString().substring(0, 10))
            .input('monto', sql.Decimal(15, 2), montoTotal)
            .query(`
                INSERT INTO dbo.contrato (idProyecto, idTipoContrato, idEstadoContrato, numeroContrato, fechaContrato, montoTotal)
                VALUES (@idProy, @idTipo, @idEstado, @num, @fechaC, @monto);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idContrato;
            `);

        res.status(201).json({
            mensaje: 'Contrato anterior rescindido y nuevo contrato creado (Vigente).',
            idContratoNuevo: nuevo.recordset[0].idContrato
        });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── DELETE eliminar contrato ─────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.contrato WHERE idContrato = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Contrato no encontrado' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.contrato WHERE idContrato = @id`);
        res.json({ mensaje: 'Contrato eliminado correctamente' });
    } catch (err) {
        res.status(400).json({ error: 'No se puede eliminar: el contrato tiene cuotas o pagos asociados. Considere rescindirlo cambiando su estado.' });
    }
});

module.exports = router;

