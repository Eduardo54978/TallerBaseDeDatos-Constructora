const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                p.idProyecto,
                p.nombreProyecto,
                p.descripcion,
                p.ubicacion,
                p.fechaInicio,
                p.fechaFinEstimada,
                p.fechaFinReal,
                tp.nombreTipoProyecto,
                ep.nombreEstadoProyecto,
                c.nombre AS cliente
            FROM proyecto p
            JOIN tipoproyecto   tp ON p.idTipoProyecto   = tp.idTipoProyecto
            JOIN estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
            JOIN cliente        c  ON p.idCliente        = c.idCliente
            ORDER BY p.idProyecto
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
