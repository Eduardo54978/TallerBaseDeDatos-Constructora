const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

// ÔöÇÔöÇ RUTAS ESPEC├ìFICAS (deben ir antes de /:id) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/pendientes', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                c.idCuota,
                c.idContrato,
                c.numeroCuota,
                c.fechaVencimiento,
                c.montoCuota,
                c.saldoPendiente,
                ep.nombreEstadoPago AS estadoPago
            FROM cuota c
            JOIN estadopago ep ON c.idEstadoPago = ep.idEstadoPago
            WHERE c.saldoPendiente > 0
            ORDER BY c.fechaVencimiento
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/vencidas', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                c.idCuota,
                c.idContrato,
                c.numeroCuota,
                c.fechaVencimiento,
                c.montoCuota,
                c.saldoPendiente,
                ep.nombreEstadoPago AS estadoPago
            FROM cuota c
            JOIN estadopago ep ON c.idEstadoPago = ep.idEstadoPago
            WHERE c.fechaVencimiento < CAST(GETDATE() AS DATE)
              AND c.saldoPendiente > 0
            ORDER BY c.fechaVencimiento
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/contrato/:idContrato', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('idContrato', sql.Int, req.params.idContrato)
            .query(`
                SELECT
                    c.idCuota,
                    c.idContrato,
                    c.numeroCuota,
                    c.fechaVencimiento,
                    c.montoCuota,
                    c.saldoPendiente,
                    ep.nombreEstadoPago AS estadoPago
                FROM cuota c
                JOIN estadopago ep ON c.idEstadoPago = ep.idEstadoPago
                WHERE c.idContrato = @idContrato
                ORDER BY c.numeroCuota
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ CRUD CUOTAS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                c.idCuota,
                c.idContrato,
                c.numeroCuota,
                c.fechaVencimiento,
                c.montoCuota,
                c.saldoPendiente,
                ep.nombreEstadoPago AS estadoPago
            FROM cuota c
            JOIN estadopago ep ON c.idEstadoPago = ep.idEstadoPago
            ORDER BY c.idContrato, c.numeroCuota
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    c.idCuota,
                    c.idContrato,
                    c.numeroCuota,
                    c.fechaVencimiento,
                    c.montoCuota,
                    c.saldoPendiente,
                    ep.nombreEstadoPago AS estadoPago
                FROM cuota c
                JOIN estadopago ep ON c.idEstadoPago = ep.idEstadoPago
                WHERE c.idCuota = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Cuota no encontrada' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { idContrato, numeroCuota, fechaVencimiento, montoCuota, saldoPendiente, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('idContrato',       sql.Int,            idContrato)
            .input('numeroCuota',      sql.Int,            numeroCuota)
            .input('fechaVencimiento', sql.Date,           fechaVencimiento)
            .input('montoCuota',       sql.Decimal(18, 2), montoCuota)
            .input('saldoPendiente',   sql.Decimal(18, 2), saldoPendiente)
            .input('idEstadoPago',     sql.Int,            idEstadoPago)
            .query(`
                INSERT INTO cuota (idContrato, numeroCuota, fechaVencimiento, montoCuota, saldoPendiente, idEstadoPago)
                OUTPUT INSERTED.idCuota
                VALUES (@idContrato, @numeroCuota, @fechaVencimiento, @montoCuota, @saldoPendiente, @idEstadoPago)
            `);
        res.status(201).json({ idCuota: result.recordset[0].idCuota });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { idContrato, numeroCuota, fechaVencimiento, montoCuota, saldoPendiente, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id',               sql.Int,            req.params.id)
            .input('idContrato',       sql.Int,            idContrato)
            .input('numeroCuota',      sql.Int,            numeroCuota)
            .input('fechaVencimiento', sql.Date,           fechaVencimiento)
            .input('montoCuota',       sql.Decimal(18, 2), montoCuota)
            .input('saldoPendiente',   sql.Decimal(18, 2), saldoPendiente)
            .input('idEstadoPago',     sql.Int,            idEstadoPago)
            .query(`
                UPDATE cuota
                SET idContrato       = @idContrato,
                    numeroCuota      = @numeroCuota,
                    fechaVencimiento = @fechaVencimiento,
                    montoCuota       = @montoCuota,
                    saldoPendiente   = @saldoPendiente,
                    idEstadoPago     = @idEstadoPago
                WHERE idCuota = @id
            `);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Cuota no encontrada' });
        res.json({ mensaje: 'Cuota actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM cuota WHERE idCuota = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Cuota no encontrada' });
        res.json({ mensaje: 'Cuota eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
