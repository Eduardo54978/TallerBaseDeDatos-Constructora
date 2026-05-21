const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// ÔöÇÔöÇ CAT├üLOGO ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/estados', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT idEstadoOrden, nombreEstadoOrden, descripcionEstadoOrden
            FROM estadoorden
            ORDER BY nombreEstadoOrden
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ ├ôRDENES POR PROVEEDOR ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/proveedor/:idProveedor', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('idProveedor', sql.Int, req.params.idProveedor)
            .query(`
                SELECT
                    oc.idOrdenCompra,
                    oc.fechaOrden,
                    oc.montoTotal,
                    p.nombreProveedor,
                    eo.nombreEstadoOrden AS estadoOrden
                FROM ordencompra oc
                JOIN proveedor   p  ON oc.idProveedor   = p.idProveedor
                JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
                WHERE oc.idProveedor = @idProveedor
                ORDER BY oc.fechaOrden
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ ├ôRDENES DE COMPRA ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                oc.idOrdenCompra,
                oc.fechaOrden,
                oc.montoTotal,
                p.nombreProveedor,
                eo.nombreEstadoOrden AS estadoOrden
            FROM ordencompra oc
            JOIN proveedor   p  ON oc.idProveedor   = p.idProveedor
            JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
            ORDER BY oc.fechaOrden
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const orden = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    oc.idOrdenCompra,
                    oc.fechaOrden,
                    oc.montoTotal,
                    p.nombreProveedor,
                    eo.nombreEstadoOrden AS estadoOrden
                FROM ordencompra oc
                JOIN proveedor   p  ON oc.idProveedor   = p.idProveedor
                JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
                WHERE oc.idOrdenCompra = @id
            `);

        if (orden.recordset.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });

        const detalle = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    dc.idDetalleCompra,
                    dc.idMaterial,
                    m.nombreMaterial,
                    dc.cantidad,
                    dc.precioUnitario,
                    dc.total
                FROM detallecompra dc
                JOIN material m ON dc.idMaterial = m.idMaterial
                WHERE dc.idOrdenCompra = @id
                ORDER BY dc.idDetalleCompra
            `);

        res.json({ ...orden.recordset[0], detalle: detalle.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { fechaOrden, idEstadoOrden, idProveedor, montoTotal } = req.body;
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('fechaOrden',    sql.Date,           fechaOrden)
            .input('idEstadoOrden', sql.Int,            idEstadoOrden)
            .input('idProveedor',   sql.Int,            idProveedor)
            .input('montoTotal',    sql.Decimal(18, 2), montoTotal)
            .query(`
                INSERT INTO ordencompra (fechaOrden, idEstadoOrden, idProveedor, montoTotal)
                OUTPUT INSERTED.idOrdenCompra
                VALUES (@fechaOrden, @idEstadoOrden, @idProveedor, @montoTotal)
            `);
        res.status(201).json({ idOrdenCompra: result.recordset[0].idOrdenCompra });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { fechaOrden, idEstadoOrden, idProveedor, montoTotal } = req.body;
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id',            sql.Int,            req.params.id)
            .input('fechaOrden',    sql.Date,           fechaOrden)
            .input('idEstadoOrden', sql.Int,            idEstadoOrden)
            .input('idProveedor',   sql.Int,            idProveedor)
            .input('montoTotal',    sql.Decimal(18, 2), montoTotal)
            .query(`
                UPDATE ordencompra
                SET fechaOrden    = @fechaOrden,
                    idEstadoOrden = @idEstadoOrden,
                    idProveedor   = @idProveedor,
                    montoTotal    = @montoTotal
                WHERE idOrdenCompra = @id
            `);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ mensaje: 'Orden actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM ordencompra WHERE idOrdenCompra = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ mensaje: 'Orden eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ DETALLE DE COMPRA ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/:id/detalle', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    dc.idDetalleCompra,
                    dc.idOrdenCompra,
                    dc.idMaterial,
                    m.nombreMaterial,
                    dc.cantidad,
                    dc.precioUnitario,
                    dc.total
                FROM detallecompra dc
                JOIN material m ON dc.idMaterial = m.idMaterial
                WHERE dc.idOrdenCompra = @id
                ORDER BY dc.idDetalleCompra
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/detalle', async (req, res) => {
    const { idMaterial, cantidad, precioUnitario } = req.body;
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('idOrdenCompra',  sql.Int,            req.params.id)
            .input('idMaterial',     sql.Int,            idMaterial)
            .input('cantidad',       sql.Decimal(18, 2), cantidad)
            .input('precioUnitario', sql.Decimal(18, 2), precioUnitario)
            .query(`
                INSERT INTO detallecompra (idOrdenCompra, idMaterial, cantidad, precioUnitario)
                OUTPUT INSERTED.idDetalleCompra
                VALUES (@idOrdenCompra, @idMaterial, @cantidad, @precioUnitario)
            `);
        res.status(201).json({ idDetalleCompra: result.recordset[0].idDetalleCompra });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

