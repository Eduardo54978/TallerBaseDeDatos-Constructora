const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT TOP 200
                e.idEmpleado,
                e.nombre,
                e.apellido,
                e.email,
                e.numCelular,
                e.salario,
                e.fechaContratacion,
                c.nombreCargo,
                d.nombreDepartamento,
                ee.nombreEstadoEmpleado
            FROM empleado e
            JOIN cargo c           ON e.idCargo         = c.idCargo
            JOIN departamento d    ON e.idDepartamento  = d.idDepartamento
            JOIN estadoempleado ee ON e.idEstadoEmpleado = ee.idEstadoEmpleado
            ORDER BY e.apellido
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;