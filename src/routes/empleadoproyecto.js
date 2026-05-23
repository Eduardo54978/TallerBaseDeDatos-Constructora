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
          WHEN ep.fechaFin IS NULL OR ep.fechaFin > CAST(GETDATE() AS DATE)
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

// Empleados disponibles (sin asignación activa) para el autocompletado, por nombre o ID
router.get('/disponibles/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('q', sql.NVarChar, `%${q}%`)
      .query(`
        SELECT TOP 10 e.idEmpleado, e.nombre + ' ' + e.apellido AS nombreCompleto
        FROM dbo.empleado e
        WHERE e.idEstadoEmpleado = 1
          AND (e.nombre + ' ' + e.apellido LIKE @q OR CAST(e.idEmpleado AS NVARCHAR) LIKE @q)
          AND NOT EXISTS (
            SELECT 1 FROM dbo.empleadoproyecto ep
            WHERE ep.idEmpleado = e.idEmpleado
              AND (ep.fechaFin IS NULL OR ep.fechaFin > CAST(GETDATE() AS DATE))
          )
        ORDER BY e.nombre, e.apellido
      `);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Todos los empleados activos con su estado de disponibilidad (para tabla informativa)
router.get('/empleados-estado', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT
        e.idEmpleado,
        e.nombre + ' ' + e.apellido AS nombreCompleto,
        c.nombreCargo,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.empleadoproyecto ep
          WHERE ep.idEmpleado = e.idEmpleado
            AND (ep.fechaFin IS NULL OR ep.fechaFin > CAST(GETDATE() AS DATE))
        ) THEN 0 ELSE 1 END AS disponible
      FROM dbo.empleado e
      JOIN dbo.cargo c ON e.idCargo = c.idCargo
      WHERE e.idEstadoEmpleado = 1
      ORDER BY e.nombre, e.apellido
    `);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/roles/lista', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT idRolProyecto, nombreRolProyecto FROM dbo.rolproyecto ORDER BY nombreRolProyecto`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { idEmpleado, idProyecto, idRolProyecto, fechaInicio, fechaFin } = req.body;

  if (!idEmpleado || !idProyecto || !idRolProyecto)
    return res.status(400).json({ error: 'Empleado, proyecto y rol son obligatorios' });

  try {
    const pool = await sql.connect(config);

    // El proyecto no puede estar Finalizado
    const proy = await pool.request()
      .input('id', sql.Int, idProyecto)
      .query(`SELECT idEstadoProyecto FROM dbo.proyecto WHERE idProyecto = @id`);
    if (proy.recordset.length === 0)
      return res.status(400).json({ error: 'El proyecto no existe' });
    if (proy.recordset[0].idEstadoProyecto === 3)
      return res.status(400).json({ error: 'No se puede asignar personal a un proyecto Finalizado.' });

    // El empleado debe estar activo
    const emp = await pool.request()
      .input('id', sql.Int, idEmpleado)
      .query(`SELECT idEstadoEmpleado FROM dbo.empleado WHERE idEmpleado = @id`);
    if (emp.recordset.length === 0)
      return res.status(400).json({ error: 'El empleado no existe' });
    if (emp.recordset[0].idEstadoEmpleado !== 1)
      return res.status(400).json({ error: 'El empleado está inactivo (dado de baja).' });

    // El empleado debe estar disponible (sin asignación activa)
    const ocupado = await pool.request()
      .input('id', sql.Int, idEmpleado)
      .query(`
        SELECT 1 FROM dbo.empleadoproyecto
        WHERE idEmpleado = @id AND (fechaFin IS NULL OR fechaFin > CAST(GETDATE() AS DATE))
      `);
    if (ocupado.recordset.length > 0)
      return res.status(400).json({ error: 'El empleado ya está asignado a un proyecto activo. No está disponible.' });

    const result = await pool.request()
      .input('idEmpleado', sql.Int, idEmpleado)
      .input('idProyecto', sql.Int, idProyecto)
      .input('idRolProyecto', sql.Int, idRolProyecto)
      .input('fechaInicio', sql.Date, fechaInicio || null)
      .input('fechaFin', sql.Date, fechaFin || null)
      .query(`
        INSERT INTO dbo.empleadoproyecto (idEmpleado, idProyecto, idRolProyecto, fechaInicio, fechaFin)
        OUTPUT INSERTED.idEmpleadoProyecto
        VALUES (@idEmpleado, @idProyecto, @idRolProyecto, @fechaInicio, @fechaFin)
      `);
    res.status(201).json({ idEmpleadoProyecto: result.recordset[0].idEmpleadoProyecto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finalizar una asignación (libera al empleado: fechaFin = hoy)
router.put('/:id/finalizar', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        UPDATE dbo.empleadoproyecto
        SET fechaFin = CAST(GETDATE() AS DATE)
        WHERE idEmpleadoProyecto = @id
      `);
    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json({ mensaje: 'Asignación finalizada. El empleado queda disponible.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

