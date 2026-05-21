const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// ÔöÇÔöÇ GET todos los contratos ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT 
                c.idContrato, c.numeroContrato, c.fechaContrato, c.fechaInicio,
                c.fechaVencimiento, c.montoTotal, tc.nombreTipoContrato,
                ec.nombreEstadoContrato, p.nombreProyecto, cl.nombre AS nombreCliente
            FROM dbo.contrato c
            JOIN dbo.tipocontrato   tc ON c.idTipoContrato   = tc.idTipoContrato
            JOIN dbo.estadocontrato ec ON c.idEstadoContrato = ec.idEstadoContrato
            JOIN dbo.proyecto       p  ON c.idProyecto       = p.idProyecto
            JOIN dbo.cliente        cl ON p.idCliente        = cl.idCliente
            ORDER BY c.fechaContrato DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
                SELECT c.*, tc.nombreTipoContrato, ec.nombreEstadoContrato, p.nombreProyecto, cl.nombre AS nombreCliente
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ POST registrar contrato ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
router.post('/', async (req, res) => {
    const { idProyecto, idTipoContrato, numeroContrato, fechaContrato, fechaInicio, fechaVencimiento, montoTotal } = req.body;

    if (!numeroContrato || !montoTotal || !idProyecto)
        return res.status(400).json({ error: 'Faltan datos obligatorios para el contrato' });

    try {
        const pool = await sql.connect(config);

        // Validar proyecto y tipo
        const proyExiste = await pool.request().input('id', sql.Int, idProyecto).query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0) return res.status(400).json({ error: 'Proyecto no existe' });

        // Buscar estado "Vigente" (Asumimos ID 1 para el ejemplo, o buscamos por nombre)
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
            .input('monto',    sql.Decimal,  montoTotal)
            .query(`
                INSERT INTO dbo.contrato 
                    (idProyecto, idTipoContrato, idEstadoContrato, numeroContrato, fechaContrato, fechaInicio, fechaVencimiento, montoTotal)
                OUTPUT INSERTED.idContrato
                VALUES (@idProy, @idTipo, @idEstado, @num, @fechaC, @fechaI, @fechaV, @monto)
            `);
        res.status(201).json({ idContrato: result.recordset[0].idContrato, mensaje: 'Contrato creado con estado Vigente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

