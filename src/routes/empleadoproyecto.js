const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT
        ep.idEmpleadoProyecto,
        ep.idEmpleado,
        e.nombre + ' ' + e.apellido AS empleado,
        e.ci,
        c.nombreCargo,
        ep.idProyecto,
        p.nombreProyecto,
        tp.nombreTipoProyecto,
        est.nombreEstadoProyecto,
        rp.nombreRolProyecto,
        ep.fechaInicio,
        ep.fechaFin,
        CASE
          WHEN ep.fechaFin IS NULL OR ep.fechaFin >= CAST(GETDATE() AS DATE)
          THEN 'Activo'
          ELSE 'Finalizado'
        END AS estadoAsignacion
      FROM dbo.empleadoproyecto ep
      JOIN dbo.empleado e ON ep.idEmpleado = e.idEmpleado
      JOIN dbo.cargo c ON e.idCargo = c.idCargo
      JOIN dbo.proyecto p ON ep.idProyecto = p.idProyecto
      JOIN dbo.tipoproyecto tp ON p.idTipoProyecto = tp.idTipoProyecto
      JOIN dbo.estadoproyecto est ON p.idEstadoProyecto = est.idEstadoProyecto
      JOIN dbo.rolproyecto rp ON ep.idRolProyecto = rp.idRolProyecto
      ORDER BY p.nombreProyecto, e.apellido, e.nombre
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

