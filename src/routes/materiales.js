const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                m.idMaterial,
                m.nombreMaterial,
                m.precioUnitario,
                m.descripcion,
                tm.nombreTipoMaterial,
                um.nombreUnidadMedida
            FROM material m
            JOIN tipomaterial  tm ON m.idTipoMaterial  = tm.idTipoMaterial
            JOIN unidadmedida  um ON m.idUnidadMedida  = um.idUnidadMedida
            ORDER BY m.nombreMaterial
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
