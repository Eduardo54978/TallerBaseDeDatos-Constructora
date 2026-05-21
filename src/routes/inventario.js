const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                i.idInventario,
                m.nombreMaterial,
                i.stockActual,
                i.stockMinimo,
                i.ubicacion,
                i.fechaActualizacion
            FROM inventario i
            JOIN material m ON i.idMaterial = m.idMaterial
            ORDER BY m.nombreMaterial
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
