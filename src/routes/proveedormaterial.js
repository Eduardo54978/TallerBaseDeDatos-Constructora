const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

router.post('/', async (req, res) => {
    const { idProveedor, idMaterial, precioProveedor, tiempoEntrega } = req.body;

    if (!idProveedor || !idMaterial || precioProveedor == null)
        return res.status(400).json({ error: 'idProveedor, idMaterial y precioProveedor son obligatorios' });

    if (precioProveedor <= 0)
        return res.status(400).json({ error: 'El precio debe ser mayor a 0' });

    try {
        const pool = await sql.connect(config);

        const provExiste = await pool.request()
            .input('id', sql.Int, idProveedor)
            .query(`SELECT 1 FROM dbo.proveedor WHERE idProveedor = @id`);
        if (provExiste.recordset.length === 0)
            return res.status(404).json({ error: 'Proveedor no encontrado o inactivo' });

        const matExiste = await pool.request()
            .input('id', sql.Int, idMaterial)
            .query(`SELECT 1 FROM dbo.material WHERE idMaterial = @id`);
        if (matExiste.recordset.length === 0)
            return res.status(404).json({ error: 'Material no encontrado' });

        const dup = await pool.request()
            .input('idProv', sql.Int, idProveedor)
            .input('idMat',  sql.Int, idMaterial)
            .query(`SELECT 1 FROM dbo.proveedormaterial WHERE idProveedor = @idProv AND idMaterial = @idMat`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Este material ya está asignado a ese proveedor' });

        const result = await pool.request()
            .input('idProv',   sql.Int,          idProveedor)
            .input('idMat',    sql.Int,          idMaterial)
            .input('precio',   sql.Decimal(18,2), precioProveedor)
            .input('tiempo',   sql.Int,          tiempoEntrega || null)
            .query(`
                INSERT INTO dbo.proveedormaterial (idProveedor, idMaterial, precioProveedor, tiempoEntrega)
                OUTPUT INSERTED.idProveedorMaterial
                VALUES (@idProv, @idMat, @precio, @tiempo)
            `);

        res.status(201).json({ idProveedorMaterial: result.recordset[0].idProveedorMaterial });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { precioProveedor, tiempoEntrega } = req.body;

    if (precioProveedor == null || Number(precioProveedor) <= 0)
        return res.status(400).json({ error: 'El precio debe ser mayor a 0' });

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('precio', sql.Decimal(18, 2), precioProveedor)
            .input('tiempo', sql.Int, tiempoEntrega || null)
            .query(`
                UPDATE dbo.proveedormaterial
                SET precioProveedor = @precio, tiempoEntrega = @tiempo
                WHERE idProveedorMaterial = @id
            `);
        if (result.rowsAffected[0] === 0)
            return res.status(404).json({ error: 'Registro de catálogo no encontrado' });
        res.json({ mensaje: 'Catálogo actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.proveedormaterial WHERE idProveedorMaterial = @id`);
        if (result.rowsAffected[0] === 0)
            return res.status(404).json({ error: 'Registro de catálogo no encontrado' });
        res.json({ mensaje: 'Material quitado del catálogo correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
