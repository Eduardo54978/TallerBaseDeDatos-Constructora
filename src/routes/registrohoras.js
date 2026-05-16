const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT TOP 200
            rh.idRegistroHoras,
            e.nombre,
            e.apellido,
            p.nombreProyecto,
            rh.fecha,
            rh.horasTrabajadas,
            rh.pagoPorHora,
           rh.horasTrabajadas * rh.pagoPorHora AS totalPago
           FROM dbo.registrohoras rh
           JOIN dbo.empleado e ON rh.idEmpleado = e.idEmpleado
           JOIN dbo.proyecto p ON rh.idProyecto = p.idProyecto
           ORDER BY rh.fecha DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;