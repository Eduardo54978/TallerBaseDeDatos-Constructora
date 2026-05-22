const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

router.get('/alertas', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const existe = await pool.request().query(`
      SELECT OBJECT_ID('dbo.alertas_inventario') AS idTabla
    `);

    if (!existe.recordset[0].idTabla) {
      return res.json([]);
    }

    const result = await pool.request().query(`
      SELECT TOP 100 *
      FROM dbo.alertas_inventario
      ORDER BY 1 DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT
        mp.idMaterialProyecto,
        p.idProyecto,
        p.nombreProyecto,
        m.idMaterial,
        m.nombreMaterial,
        tm.nombreTipoMaterial,
        um.nombreUnidadMedida,
        mp.cantidadUtilizada,
        mp.fechaRegistro,
        mp.costoTotal
      FROM dbo.materialproyecto mp
      JOIN dbo.proyecto p ON mp.idProyecto = p.idProyecto
      JOIN dbo.material m ON mp.idMaterial = m.idMaterial
      JOIN dbo.tipomaterial tm ON m.idTipoMaterial = tm.idTipoMaterial
      JOIN dbo.unidadmedida um ON m.idUnidadMedida = um.idUnidadMedida
      ORDER BY mp.idMaterialProyecto ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { idProyecto, idMaterial, cantidadUtilizada, fechaRegistro, costoTotal } = req.body;

  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('idProyecto', sql.Int, idProyecto)
      .input('idMaterial', sql.Int, idMaterial)
      .input('cantidadUtilizada', sql.Decimal(18, 2), cantidadUtilizada)
      .input('fechaRegistro', sql.Date, fechaRegistro)
      .input('costoTotal', sql.Decimal(18, 2), costoTotal)
      .query(`
        INSERT INTO dbo.materialproyecto
          (idProyecto, idMaterial, cantidadUtilizada, fechaRegistro, costoTotal)
        VALUES
          (@idProyecto, @idMaterial, @cantidadUtilizada, @fechaRegistro, @costoTotal);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS idMaterialProyecto;
      `);

    res.status(201).json({
      idMaterialProyecto: result.recordset[0].idMaterialProyecto
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;