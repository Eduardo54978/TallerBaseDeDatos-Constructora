const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

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
    res.status(400).json({ error: errorAmigable(err) });
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
    res.status(400).json({ error: errorAmigable(err) });
  }
});

// Comparativo cotizado (cotización interna) vs gastado (uso real) por proyecto
router.get('/comparativo/:idProyecto', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('id', sql.Int, req.params.idProyecto)
      .query(`
        WITH cotizado AS (
          SELECT dci.idMaterial,
                 SUM(dci.cantidadEstimada) AS cantCot,
                 SUM(dci.cantidadEstimada * dci.costoUnitarioEstimado) AS costoCot
          FROM dbo.detallecotizacioninterna dci
          JOIN dbo.cotizacioninterna ci ON dci.idCotizacionInterna = ci.idCotizacionInterna
          WHERE ci.idProyecto = @id
          GROUP BY dci.idMaterial
        ),
        gastado AS (
          SELECT mp.idMaterial,
                 SUM(mp.cantidadUtilizada) AS cantGas,
                 SUM(mp.costoTotal) AS costoGas
          FROM dbo.materialproyecto mp
          WHERE mp.idProyecto = @id
          GROUP BY mp.idMaterial
        )
        SELECT
          m.idMaterial,
          m.nombreMaterial,
          ISNULL(c.cantCot, 0)  AS cantidadCotizada,
          ISNULL(c.costoCot, 0) AS costoCotizado,
          ISNULL(g.cantGas, 0)  AS cantidadGastada,
          ISNULL(g.costoGas, 0) AS costoGastado,
          ISNULL(g.cantGas, 0) - ISNULL(c.cantCot, 0) AS diferenciaCantidad,
          ISNULL(g.costoGas, 0) - ISNULL(c.costoCot, 0) AS diferenciaCosto
        FROM cotizado c
        FULL OUTER JOIN gastado g ON c.idMaterial = g.idMaterial
        JOIN dbo.material m ON m.idMaterial = COALESCE(c.idMaterial, g.idMaterial)
        ORDER BY m.nombreMaterial
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(400).json({ error: errorAmigable(err) });
  }
});

router.post('/', async (req, res) => {
  const { idProyecto, idMaterial, cantidadUtilizada, fechaRegistro, costoTotal } = req.body;

  try {
    const pool = await sql.connect(config);

    // Solo se puede registrar uso de materiales en proyectos En ejecución (estado 2)
    const proy = await pool.request()
      .input('id', sql.Int, idProyecto)
      .query(`SELECT idEstadoProyecto FROM dbo.proyecto WHERE idProyecto = @id`);
    if (proy.recordset.length === 0)
      return res.status(400).json({ error: 'El proyecto no existe' });
    if (proy.recordset[0].idEstadoProyecto !== 2)
      return res.status(400).json({ error: 'Solo se puede registrar uso de materiales en proyectos En ejecución.' });

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
    res.status(400).json({ error: errorAmigable(err) });
  }
});

module.exports = router;