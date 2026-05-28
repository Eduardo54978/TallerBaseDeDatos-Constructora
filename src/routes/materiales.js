const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.get('/:id/precio-referencia', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const base = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT precioUnitario, nombreMaterial FROM material WHERE idMaterial = @id`);
        if (base.recordset.length === 0)
            return res.status(404).json({ error: 'Material no encontrado' });

        const ultima = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT TOP 1 dc.precioUnitario, oc.fechaOrden
                FROM detallecompra dc
                JOIN ordencompra oc ON dc.idOrdenCompra = oc.idOrdenCompra
                WHERE dc.idMaterial = @id
                ORDER BY oc.fechaOrden DESC, dc.idDetalleCompra DESC
            `);

        res.json({
            precioCatalogo: base.recordset[0].precioUnitario,
            ultimaCompra: ultima.recordset.length > 0 ? {
                precio: ultima.recordset[0].precioUnitario,
                fecha: ultima.recordset[0].fechaOrden
            } : null
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`SELECT TOP 10 idMaterial, nombreMaterial FROM material WHERE nombreMaterial LIKE @q OR CAST(idMaterial AS NVARCHAR) LIKE @q ORDER BY nombreMaterial`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tipos/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT idTipoMaterial, nombreTipoMaterial FROM tipomaterial ORDER BY nombreTipoMaterial`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unidades/lista', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`SELECT idUnidadMedida, nombreUnidadMedida FROM unidadmedida ORDER BY nombreUnidadMedida`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                m.idMaterial,
                m.nombreMaterial,
                m.precioUnitario,
                m.descripcion,
                m.idTipoMaterial,
                m.idUnidadMedida,
                tm.nombreTipoMaterial,
                um.nombreUnidadMedida
            FROM material m
            JOIN tipomaterial  tm ON m.idTipoMaterial  = tm.idTipoMaterial
            JOIN unidadmedida  um ON m.idUnidadMedida  = um.idUnidadMedida
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
                SELECT m.idMaterial, m.nombreMaterial, m.precioUnitario, m.descripcion,
                       m.idTipoMaterial, m.idUnidadMedida, tm.nombreTipoMaterial, um.nombreUnidadMedida
                FROM material m
                JOIN tipomaterial tm ON m.idTipoMaterial = tm.idTipoMaterial
                JOIN unidadmedida um ON m.idUnidadMedida = um.idUnidadMedida
                WHERE m.idMaterial = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Material no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { nombreMaterial, idTipoMaterial, idUnidadMedida, precioUnitario, descripcion } = req.body;

    if (!nombreMaterial || !idTipoMaterial || !idUnidadMedida || precioUnitario == null)
        return res.status(400).json({ error: 'nombreMaterial, idTipoMaterial, idUnidadMedida y precioUnitario son obligatorios' });

    if (Number(precioUnitario) <= 0)
        return res.status(400).json({ error: 'El precio unitario debe ser mayor a 0' });

    try {
        const pool = await sql.connect(config);

        const dup = await pool.request()
            .input('nombre', sql.NVarChar, nombreMaterial)
            .query(`SELECT 1 FROM material WHERE nombreMaterial = @nombre`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ya existe un material con ese nombre' });

        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombreMaterial)
            .input('idTipo', sql.Int, idTipoMaterial)
            .input('idUnidad', sql.Int, idUnidadMedida)
            .input('precio', sql.Decimal(12, 2), precioUnitario)
            .input('descripcion', sql.NVarChar, descripcion || null)
            .query(`
                INSERT INTO material (nombreMaterial, idTipoMaterial, idUnidadMedida, precioUnitario, descripcion)
                OUTPUT INSERTED.idMaterial
                VALUES (@nombre, @idTipo, @idUnidad, @precio, @descripcion)
            `);
        res.status(201).json({ idMaterial: result.recordset[0].idMaterial });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { nombreMaterial, idTipoMaterial, idUnidadMedida, precioUnitario, descripcion } = req.body;

    if (precioUnitario != null && Number(precioUnitario) <= 0)
        return res.status(400).json({ error: 'El precio unitario debe ser mayor a 0' });

    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM material WHERE idMaterial = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Material no encontrado' });

        if (nombreMaterial) {
            const dup = await pool.request()
                .input('nombre', sql.NVarChar, nombreMaterial)
                .input('id', sql.Int, req.params.id)
                .query(`SELECT 1 FROM material WHERE nombreMaterial = @nombre AND idMaterial <> @id`);
            if (dup.recordset.length > 0)
                return res.status(400).json({ error: 'El nombre ya está en uso por otro material' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar, nombreMaterial)
            .input('idTipo', sql.Int, idTipoMaterial)
            .input('idUnidad', sql.Int, idUnidadMedida)
            .input('precio', sql.Decimal(12, 2), precioUnitario)
            .input('descripcion', sql.NVarChar, descripcion || null)
            .query(`
                UPDATE material SET
                    nombreMaterial = @nombre,
                    idTipoMaterial = @idTipo,
                    idUnidadMedida = @idUnidad,
                    precioUnitario = @precio,
                    descripcion = @descripcion
                WHERE idMaterial = @id
            `);
        res.json({ mensaje: 'Material actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM material WHERE idMaterial = @id`);
        res.json({ mensaje: 'Material eliminado correctamente' });
    } catch (err) {
        res.status(400).json({ error: 'No se puede eliminar: el material tiene registros asociados (compras, inventario o proyectos).' });
    }
});

module.exports = router;
