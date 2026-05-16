const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                cc.idCotizacionCliente,
                cc.numeroCotizacionCliente,
                cc.fechaCotizacion,
                cc.fechaValidez,
                cc.observaciones,
                p.nombreProyecto,
                ec.nombreEstadoCotizacion
            FROM dbo.cotizacioncliente cc
            JOIN dbo.proyecto p          ON cc.idProyecto        = p.idProyecto
            JOIN dbo.estadocotizacion ec ON cc.idEstadoCotizacion = ec.idEstadoCotizacion
            ORDER BY cc.fechaCotizacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;