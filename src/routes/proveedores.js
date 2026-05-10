const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                idProveedor,
                nombreProveedor,
                numCelular,
                email,
                direccion,
                ciudad,
                pais
            FROM proveedor
            ORDER BY nombreProveedor
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;