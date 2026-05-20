const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                p.idProyecto,
                p.nombreProyecto,
                p.descripcion,
                p.ubicacion,
                p.fechaInicio,
                p.fechaFinEstimada,
                p.fechaFinReal,
                tp.nombreTipoProyecto,
                ep.nombreEstadoProyecto,
                c.nombre AS cliente
            FROM proyecto p
            JOIN tipoproyecto   tp ON p.idTipoProyecto   = tp.idTipoProyecto
            JOIN estadoproyecto ep ON p.idEstadoProyecto = ep.idEstadoProyecto
            JOIN cliente        c  ON p.idCliente        = c.idCliente
            ORDER BY p.idProyecto
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/form/opciones', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const tipos = await pool.request().query(`
      SELECT idTipoProyecto, nombreTipoProyecto
      FROM dbo.tipoproyecto
      ORDER BY nombreTipoProyecto
    `);

    const estados = await pool.request().query(`
      SELECT idEstadoProyecto, nombreEstadoProyecto
      FROM dbo.estadoproyecto
      ORDER BY idEstadoProyecto
    `);

    const clientes = await pool.request().query(`
      SELECT TOP 300 *
      FROM dbo.cliente
      ORDER BY idCliente
    `);

    res.json({
      tipos: tipos.recordset,
      estados: estados.recordset,
      clientes: clientes.recordset
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrar', async (req, res) => {
  try {
    const {
      nombreProyecto,
      descripcion,
      idTipoProyecto,
      ubicacion,
      fechaInicio,
      fechaFinEstimada,
      idEstadoProyecto,
      idCliente
    } = req.body;

    if (!nombreProyecto || !idTipoProyecto || !ubicacion || !fechaInicio || !fechaFinEstimada || !idEstadoProyecto || !idCliente) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const pool = await sql.connect(config);

    await pool.request()
      .input('nombreProyecto', sql.NVarChar(150), nombreProyecto)
      .input('descripcion', sql.NVarChar(255), descripcion || '')
      .input('idTipoProyecto', sql.Int, Number(idTipoProyecto))
      .input('ubicacion', sql.NVarChar(150), ubicacion)
      .input('fechaInicio', sql.Date, fechaInicio)
      .input('fechaFinEstimada', sql.Date, fechaFinEstimada)
      .input('idEstadoProyecto', sql.Int, Number(idEstadoProyecto))
      .input('idCliente', sql.Int, Number(idCliente))
      .query(`
        INSERT INTO dbo.proyecto
          (nombreProyecto, descripcion, idTipoProyecto, ubicacion, fechaInicio, fechaFinEstimada, fechaFinReal, idEstadoProyecto, idCliente)
        VALUES
          (@nombreProyecto, @descripcion, @idTipoProyecto, @ubicacion, @fechaInicio, @fechaFinEstimada, NULL, @idEstadoProyecto, @idCliente)
      `);

    res.json({ message: 'Proyecto registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/parametros/tipos', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT idTipoProyecto, nombreTipoProyecto
      FROM dbo.tipoproyecto
      ORDER BY idTipoProyecto
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parametros/tipos', async (req, res) => {
  try {
    const { nombreTipoProyecto } = req.body;

    if (!nombreTipoProyecto) {
      return res.status(400).json({ error: 'Debe ingresar el tipo de proyecto' });
    }

    const pool = await sql.connect(config);

    const existe = await pool.request()
      .input('nombreTipoProyecto', sql.NVarChar(100), nombreTipoProyecto)
      .query(`
        SELECT COUNT(*) AS total
        FROM dbo.tipoproyecto
        WHERE nombreTipoProyecto = @nombreTipoProyecto
      `);

    if (existe.recordset[0].total > 0) {
      return res.status(400).json({ error: 'Ese tipo de proyecto ya existe' });
    }

    await pool.request()
      .input('nombreTipoProyecto', sql.NVarChar(100), nombreTipoProyecto)
      .query(`
        INSERT INTO dbo.tipoproyecto (nombreTipoProyecto)
        VALUES (@nombreTipoProyecto)
      `);

    res.json({ message: 'Tipo registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/parametros/estados', async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT idEstadoProyecto, nombreEstadoProyecto
      FROM dbo.estadoproyecto
      ORDER BY idEstadoProyecto
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/parametros/estados', async (req, res) => {
  try {
    const { nombreEstadoProyecto } = req.body;

    if (!nombreEstadoProyecto) {
      return res.status(400).json({ error: 'Debe ingresar el estado de proyecto' });
    }

    const pool = await sql.connect(config);

    const existe = await pool.request()
      .input('nombreEstadoProyecto', sql.NVarChar(100), nombreEstadoProyecto)
      .query(`
        SELECT COUNT(*) AS total
        FROM dbo.estadoproyecto
        WHERE nombreEstadoProyecto = @nombreEstadoProyecto
      `);

    if (existe.recordset[0].total > 0) {
      return res.status(400).json({ error: 'Ese estado ya existe' });
    }

    await pool.request()
      .input('nombreEstadoProyecto', sql.NVarChar(100), nombreEstadoProyecto)
      .query(`
        INSERT INTO dbo.estadoproyecto (nombreEstadoProyecto)
        VALUES (@nombreEstadoProyecto)
      `);

    res.json({ message: 'Estado registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


