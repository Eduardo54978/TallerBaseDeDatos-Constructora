const express = require('express');
const router = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

function normalizarEstado(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function esPendiente(estado) {
    return normalizarEstado(estado).includes('pendiente');
}

function esEntregada(estado) {
    return normalizarEstado(estado).includes('entregad');
}

function esCancelada(estado) {
    return normalizarEstado(estado).includes('cancel');
}

async function obtenerOrdenConEstado(pool, idOrdenCompra) {
    const result = await pool.request()
        .input('idOrdenCompra', sql.Int, idOrdenCompra)
        .query(`
            SELECT 
                oc.idOrdenCompra,
                oc.idEstadoOrden,
                eo.nombreEstadoOrden
            FROM dbo.ordencompra oc
            JOIN dbo.estadoorden eo 
                ON oc.idEstadoOrden = eo.idEstadoOrden
            WHERE oc.idOrdenCompra = @idOrdenCompra
        `);

    return result.recordset[0] || null;
}

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

        const estado = await pool.request()
            .input('idEstadoOrden', sql.Int, idEstadoOrden)
            .query(`
                SELECT nombreEstadoOrden
                FROM dbo.estadoorden
                WHERE idEstadoOrden = @idEstadoOrden
            `);

        if (estado.recordset.length === 0) {
            return res.status(400).json({ error: 'Estado de orden no válido.' });
        }

        const nombreEstado = estado.recordset[0].nombreEstadoOrden;

        if (!esPendiente(nombreEstado)) {
            return res.status(400).json({
                error: 'La orden de compra debe crearse inicialmente en estado Pendiente.'
            });
        }

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

        const ordenActual = await obtenerOrdenConEstado(pool, Number(req.params.id));

        if (!ordenActual) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (!esPendiente(ordenActual.nombreEstadoOrden)) {
            return res.status(400).json({
                error: 'Solo se pueden cancelar órdenes en estado Pendiente.'
            });
        }

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

        const detalle = await pool.request()
            .input('idDetalle', sql.Int, req.params.idDetalle)
            .query(`
                SELECT 
                    dc.idDetalleCompra,
                    dc.idOrdenCompra,
                    eo.nombreEstadoOrden
                FROM dbo.detallecompra dc
                JOIN dbo.ordencompra oc 
                    ON dc.idOrdenCompra = oc.idOrdenCompra
                JOIN dbo.estadoorden eo 
                    ON oc.idEstadoOrden = eo.idEstadoOrden
                WHERE dc.idDetalleCompra = @idDetalle
            `);

        if (detalle.recordset.length === 0) {
            return res.status(404).json({ error: 'Detalle no encontrado' });
        }

        const estadoOrden = detalle.recordset[0].nombreEstadoOrden;

        if (!esPendiente(estadoOrden)) {
            return res.status(400).json({
                error: 'Solo se pueden eliminar detalles de órdenes en estado Pendiente.'
            });
        }

        const result = await pool.request()
            .input('id', sql.Int, req.params.idDetalle)
            .query(`
                DELETE FROM dbo.detallecompra 
                WHERE idDetalleCompra = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Detalle no encontrado' });
        }

        res.json({ mensaje: 'Detalle eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/:id/detalle', async (req, res) => {
    const { idMaterial, cantidad, precioUnitario } = req.body;

    try {
        const pool = await sql.connect(config);
        const idOrdenCompra = Number(req.params.id);

        const orden = await obtenerOrdenConEstado(pool, idOrdenCompra);

        if (!orden) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (!esPendiente(orden.nombreEstadoOrden)) {
            return res.status(400).json({
                error: 'Solo se pueden agregar materiales a órdenes en estado Pendiente.'
            });
        }

        if (!idMaterial || Number(cantidad) <= 0 || Number(precioUnitario) <= 0) {
            return res.status(400).json({
                error: 'Material, cantidad y precio unitario son obligatorios y deben ser mayores a 0.'
            });
        }

        const result = await pool.request()
            .input('idOrdenCompra', sql.Int, idOrdenCompra)
            .input('idMaterial', sql.Int, idMaterial)
            .input('cantidad', sql.Decimal(18, 2), cantidad)
            .input('precioUnitario', sql.Decimal(18, 2), precioUnitario)
            .query(`
                INSERT INTO dbo.detallecompra (idOrdenCompra, idMaterial, cantidad, precioUnitario)
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
            .query(`
                SELECT TOP 10 
                    oc.idOrdenCompra, 
                    p.nombreProveedor, 
                    oc.fechaOrden, 
                    'Orden #' + CAST(oc.idOrdenCompra AS NVARCHAR) + 
                    ' — ' + p.nombreProveedor + 
                    ' (' + CONVERT(VARCHAR, oc.fechaOrden, 23) + ')' AS display
                FROM ordencompra oc 
                JOIN proveedor p ON oc.idProveedor = p.idProveedor 
                WHERE p.nombreProveedor LIKE @q 
                   OR CAST(oc.idOrdenCompra AS NVARCHAR) LIKE @q 
                ORDER BY oc.idOrdenCompra DESC
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
        const idOrdenCompra = Number(req.params.id);

        const anterior = await obtenerOrdenConEstado(pool, idOrdenCompra);

        if (!anterior) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const estadoAnterior = anterior.nombreEstadoOrden;

        if (esEntregada(estadoAnterior)) {
            return res.status(400).json({
                error: 'No se puede editar una orden Entregada porque ya afectó el inventario.'
            });
        }

        if (esCancelada(estadoAnterior)) {
            return res.status(400).json({
                error: 'No se puede editar una orden Cancelada.'
            });
        }

        const nuevoEstadoRow = await pool.request()
            .input('id', sql.Int, idEstadoOrden)
            .query(`
                SELECT idEstadoOrden, nombreEstadoOrden 
                FROM dbo.estadoorden 
                WHERE idEstadoOrden = @id
            `);

        if (nuevoEstadoRow.recordset.length === 0) {
            return res.status(400).json({ error: 'Estado de orden no válido.' });
        }

        const nuevoEstado = nuevoEstadoRow.recordset[0].nombreEstadoOrden;

        if (esCancelada(nuevoEstado)) {
            return res.status(400).json({
                error: 'Para cancelar una orden use el botón Cancelar compra.'
            });
        }

        const detalles = await pool.request()
            .input('id', sql.Int, idOrdenCompra)
            .query(`
                SELECT idMaterial, cantidad 
                FROM dbo.detallecompra 
                WHERE idOrdenCompra = @id
            `);

        if (esEntregada(nuevoEstado) && detalles.recordset.length === 0) {
            return res.status(400).json({
                error: 'No se puede marcar como Entregada una orden sin materiales en el detalle.'
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await new sql.Request(transaction)
                .input('id', sql.Int, idOrdenCompra)
                .input('fechaOrden', sql.Date, fechaOrden)
                .input('idEstadoOrden', sql.Int, idEstadoOrden)
                .input('idProveedor', sql.Int, idProveedor)
                .input('montoTotal', sql.Decimal(18, 2), montoTotal)
                .query(`
                    UPDATE dbo.ordencompra
                    SET fechaOrden = @fechaOrden,
                        idEstadoOrden = @idEstadoOrden,
                        idProveedor = @idProveedor,
                        montoTotal = @montoTotal
                    WHERE idOrdenCompra = @id
                `);

            if (esEntregada(nuevoEstado) && !esEntregada(estadoAnterior)) {
                await new sql.Request(transaction)
                    .input('idOrdenCompra', sql.Int, idOrdenCompra)
                    .query(`
                        MERGE dbo.inventario AS target
                        USING (
                            SELECT 
                                idMaterial, 
                                SUM(cantidad) AS cantidadTotal
                            FROM dbo.detallecompra
                            WHERE idOrdenCompra = @idOrdenCompra
                            GROUP BY idMaterial
                        ) AS source
                        ON target.idMaterial = source.idMaterial

                        WHEN MATCHED THEN
                            UPDATE SET 
                                stockActual = target.stockActual + source.cantidadTotal,
                                fechaActualizacion = CAST(GETDATE() AS DATE)

                        WHEN NOT MATCHED THEN
                            INSERT (idMaterial, stockInicial, stockActual, stockMinimo, fechaActualizacion)
                            VALUES (source.idMaterial, source.cantidadTotal, source.cantidadTotal, 0, CAST(GETDATE() AS DATE));
                    `);
            }

            await transaction.commit();

            if (esEntregada(nuevoEstado) && !esEntregada(estadoAnterior)) {
                return res.json({
                    mensaje: 'Orden marcada como Entregada. Inventario actualizado automáticamente.'
                });
            }

            res.json({ mensaje: 'Orden actualizada' });

        } catch (trxErr) {
            await transaction.rollback();
            throw trxErr;
        }

    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const idOrdenCompra = Number(req.params.id);

        const orden = await obtenerOrdenConEstado(pool, idOrdenCompra);

        if (!orden) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        if (esEntregada(orden.nombreEstadoOrden)) {
            return res.status(400).json({
                error: 'No se puede eliminar una orden Entregada porque ya afectó el inventario.'
            });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await new sql.Request(transaction)
                .input('id', sql.Int, idOrdenCompra)
                .query(`
                    DELETE FROM dbo.detallecompra
                    WHERE idOrdenCompra = @id
                `);

            const result = await new sql.Request(transaction)
                .input('id', sql.Int, idOrdenCompra)
                .query(`
                    DELETE FROM dbo.ordencompra 
                    WHERE idOrdenCompra = @id
                `);

            if (result.rowsAffected[0] === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Orden no encontrada' });
            }

            await transaction.commit();

            res.json({ mensaje: 'Orden eliminada' });

        } catch (trxErr) {
            await transaction.rollback();
            throw trxErr;
        }

    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

module.exports = router;