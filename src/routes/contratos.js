const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                c.idContrato,
                c.numeroContrato,
                c.fechaContrato,
                c.fechaInicio,
                c.fechaVencimiento,
                c.montoTotal,
                tc.nombreTipoContrato,
                ec.nombreEstadoContrato,
                p.nombreProyecto
            FROM contrato c
            JOIN tipocontrato   tc ON c.idTipoContrato   = tc.idTipoContrato
            JOIN estadocontrato ec ON c.idEstadoContrato = ec.idEstadoContrato
            JOIN proyecto       p  ON c.idProyecto       = p.idProyecto
            ORDER BY c.idContrato
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;