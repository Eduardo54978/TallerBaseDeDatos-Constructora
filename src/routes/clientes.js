const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                c.idCliente,
                c.nombre,
                c.documentoID,
                c.numCelular,
                c.email,
                c.direccion,
                c.fechaRegistro,
                tc.nombreTipoCliente
            FROM dbo.cliente c
            JOIN dbo.tipocliente tc ON c.idTipoCliente = tc.idTipoCliente
            ORDER BY c.nombre
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;