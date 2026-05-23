const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                i.idInventario,
                i.idMaterial,
                m.nombreMaterial,
                i.stockActual,
                i.stockMinimo,
                i.ubicacion,
                i.fechaActualizacion
            FROM inventario i
            JOIN material m ON i.idMaterial = m.idMaterial
            ORDER BY m.nombreMaterial
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT i.idInventario, i.idMaterial, m.nombreMaterial,
                       i.stockActual, i.stockMinimo, i.ubicacion, i.fechaActualizacion
                FROM inventario i
                JOIN material m ON i.idMaterial = m.idMaterial
                WHERE i.idInventario = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Registro de inventario no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { idMaterial, stockActual, stockMinimo, ubicacion } = req.body;

    if (!idMaterial || stockActual == null || stockMinimo == null)
        return res.status(400).json({ error: 'idMaterial, stockActual y stockMinimo son obligatorios' });

    if (Number(stockActual) < 0 || Number(stockMinimo) < 0)
        return res.status(400).json({ error: 'El stock no puede ser negativo' });

    try {
        const pool = await sql.connect(config);

        const matExiste = await pool.request()
            .input('id', sql.Int, idMaterial)
            .query(`SELECT 1 FROM material WHERE idMaterial = @id`);
        if (matExiste.recordset.length === 0)
            return res.status(400).json({ error: 'El material no existe' });

        const dup = await pool.request()
            .input('id', sql.Int, idMaterial)
            .query(`SELECT 1 FROM inventario WHERE idMaterial = @id`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Este material ya tiene un registro de inventario' });

        const result = await pool.request()
            .input('idMaterial', sql.Int, idMaterial)
            .input('stockActual', sql.Decimal(10, 2), stockActual)
            .input('stockMinimo', sql.Decimal(10, 2), stockMinimo)
            .input('ubicacion', sql.NVarChar, ubicacion || null)
            .query(`
                INSERT INTO inventario (idMaterial, stockInicial, stockActual, stockMinimo, ubicacion, fechaActualizacion)
                OUTPUT INSERTED.idInventario
                VALUES (@idMaterial, @stockActual, @stockActual, @stockMinimo, @ubicacion, CAST(GETDATE() AS DATE))
            `);
        res.status(201).json({ idInventario: result.recordset[0].idInventario });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { stockActual, stockMinimo, ubicacion } = req.body;

    if (stockActual != null && Number(stockActual) < 0)
        return res.status(400).json({ error: 'El stock actual no puede ser negativo' });
    if (stockMinimo != null && Number(stockMinimo) < 0)
        return res.status(400).json({ error: 'El stock mínimo no puede ser negativo' });

    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM inventario WHERE idInventario = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Registro de inventario no encontrado' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('stockActual', sql.Decimal(10, 2), stockActual)
            .input('stockMinimo', sql.Decimal(10, 2), stockMinimo)
            .input('ubicacion', sql.NVarChar, ubicacion || null)
            .query(`
                UPDATE inventario SET
                    stockActual = @stockActual,
                    stockMinimo = @stockMinimo,
                    ubicacion = @ubicacion,
                    fechaActualizacion = CAST(GETDATE() AS DATE)
                WHERE idInventario = @id
            `);
        res.json({ mensaje: 'Inventario actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
