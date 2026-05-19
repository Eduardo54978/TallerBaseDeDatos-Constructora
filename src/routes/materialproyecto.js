const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');

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
      ORDER BY p.nombreProyecto, mp.fechaRegistro DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
