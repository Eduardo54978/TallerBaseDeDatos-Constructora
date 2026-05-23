const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

router.get('/estados', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT idEstadoOrden, nombreEstadoOrden, descripcionEstadoOrden
            FROM estadoorden
            ORDER BY idEstadoOrden ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/proveedor/:idProveedor', async (req, res) => {
    try {
        const pool = await sql.connect(config);
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
                JOIN proveedor p ON oc.idProveedor = p.idProveedor
                JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
                WHERE oc.idProveedor = @idProveedor
                ORDER BY oc.idOrdenCompra ASC
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
                oc.idOrdenCompra,
                oc.fechaOrden,
                oc.montoTotal,
                p.nombreProveedor,
                eo.nombreEstadoOrden AS estadoOrden
            FROM ordencompra oc
            JOIN proveedor p ON oc.idProveedor = p.idProveedor
            JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
            ORDER BY oc.idOrdenCompra ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/', async (req, res) => {
    const { fechaOrden, idEstadoOrden, idProveedor, montoTotal } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('fechaOrden', sql.Date, fechaOrden)
            .input('idEstadoOrden', sql.Int, idEstadoOrden)
            .input('idProveedor', sql.Int, idProveedor)
            .input('montoTotal', sql.Decimal(18, 2), montoTotal)
            .query(`
                INSERT INTO ordencompra (fechaOrden, idEstadoOrden, idProveedor, montoTotal)
                OUTPUT INSERTED.idOrdenCompra
                VALUES (@fechaOrden, @idEstadoOrden, @idProveedor, @montoTotal)
            `);

        res.status(201).json({ idOrdenCompra: result.recordset[0].idOrdenCompra });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/:id/cancelar', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const ordenActual = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT eo.nombreEstadoOrden FROM ordencompra oc JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden WHERE oc.idOrdenCompra = @id`);
        if (ordenActual.recordset.length === 0)
            return res.status(404).json({ error: 'Orden no encontrada' });
        if (!ordenActual.recordset[0].nombreEstadoOrden.toLowerCase().includes('pendiente'))
            return res.status(400).json({ error: 'Solo se pueden cancelar órdenes en estado Pendiente.' });

        const estado = await pool.request().query(`
            SELECT TOP 1 idEstadoOrden
            FROM estadoorden
            WHERE LOWER(nombreEstadoOrden) LIKE '%cancel%'
            ORDER BY idEstadoOrden ASC
        `);

        if (estado.recordset.length === 0) {
            return res.status(400).json({ error: 'No existe un estado de orden cancelada en estadoorden' });
        }

        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('idEstadoOrden', sql.Int, estado.recordset[0].idEstadoOrden)
            .query(`
                UPDATE ordencompra
                SET idEstadoOrden = @idEstadoOrden
                WHERE idOrdenCompra = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json({ mensaje: 'Orden cancelada correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/:id/detalle', async (req, res) => {
    try {
        const pool = await sql.connect(config);
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
                ORDER BY dc.idDetalleCompra ASC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/detalle/:idDetalle', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.idDetalle)
            .query(`DELETE FROM detallecompra WHERE idDetalleCompra = @id`);
        if (result.rowsAffected[0] === 0)
            return res.status(404).json({ error: 'Detalle no encontrado' });
        res.json({ mensaje: 'Detalle eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/:id/detalle', async (req, res) => {
    const { idMaterial, cantidad, precioUnitario } = req.body;

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('idOrdenCompra', sql.Int, req.params.id)
            .input('idMaterial', sql.Int, idMaterial)
            .input('cantidad', sql.Decimal(18, 2), cantidad)
            .input('precioUnitario', sql.Decimal(18, 2), precioUnitario)
            .query(`
                INSERT INTO detallecompra (idOrdenCompra, idMaterial, cantidad, precioUnitario)
                VALUES (@idOrdenCompra, @idMaterial, @cantidad, @precioUnitario);

                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idDetalleCompra;
            `);

        res.status(201).json({ idDetalleCompra: result.recordset[0].idDetalleCompra });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`SELECT TOP 10 oc.idOrdenCompra, p.nombreProveedor, oc.fechaOrden, 'Orden #' + CAST(oc.idOrdenCompra AS NVARCHAR) + ' — ' + p.nombreProveedor + ' (' + CONVERT(VARCHAR,oc.fechaOrden,23) + ')' AS display FROM ordencompra oc JOIN proveedor p ON oc.idProveedor = p.idProveedor WHERE p.nombreProveedor LIKE @q OR CAST(oc.idOrdenCompra AS NVARCHAR) LIKE @q ORDER BY oc.idOrdenCompra DESC`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
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
                    oc.idProveedor,
                    oc.idEstadoOrden,
                    p.nombreProveedor,
                    eo.nombreEstadoOrden AS estadoOrden
                FROM ordencompra oc
                JOIN proveedor p ON oc.idProveedor = p.idProveedor
                JOIN estadoorden eo ON oc.idEstadoOrden = eo.idEstadoOrden
                WHERE oc.idOrdenCompra = @id
            `);

        if (orden.recordset.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

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
                ORDER BY dc.idDetalleCompra ASC
            `);

        res.json({
            ...orden.recordset[0],
            detalle: detalle.recordset
        });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/:id', async (req, res) => {
    const { fechaOrden, idEstadoOrden, idProveedor, montoTotal } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('fechaOrden', sql.Date, fechaOrden)
            .input('idEstadoOrden', sql.Int, idEstadoOrden)
            .input('idProveedor', sql.Int, idProveedor)
            .input('montoTotal', sql.Decimal(18, 2), montoTotal)
            .query(`
                UPDATE ordencompra
                SET fechaOrden = @fechaOrden,
                    idEstadoOrden = @idEstadoOrden,
                    idProveedor = @idProveedor,
                    montoTotal = @montoTotal
                WHERE idOrdenCompra = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json({ mensaje: 'Orden actualizada' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM ordencompra WHERE idOrdenCompra = @id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json({ mensaje: 'Orden eliminada' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

module.exports = router;