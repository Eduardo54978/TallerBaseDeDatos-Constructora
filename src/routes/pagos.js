const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

function entero(valor) {
    const n = parseInt(valor);
    return Number.isNaN(n) ? null : n;
}

function decimal(valor) {
    const n = parseFloat(valor);
    return Number.isNaN(n) ? null : n;
}

router.get('/metodos', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT idMetodoPago, nombreMetodoPago, descripcionMetodoPago
            FROM metodopago
            ORDER BY nombreMetodoPago
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/estados', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT idEstadoPago, nombreEstadoPago, descripcionEstadoPago
            FROM estadopago
            ORDER BY nombreEstadoPago
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/bonos', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('idEmpleado', sql.Int, req.query.idEmpleado ? entero(req.query.idEmpleado) : null)
            .input('idProyecto', sql.Int, req.query.idProyecto ? entero(req.query.idProyecto) : null)
            .query(`
                SELECT
                    b.idBonoAntiguedadProyecto,
                    b.idEmpleado,
                    e.nombre + ' ' + e.apellido AS empleado,
                    b.idProyecto,
                    p.nombreProyecto AS proyecto,
                    b.gestion,
                    b.aniosAntiguedad,
                    b.porcentajeBono,
                    b.salarioBaseProyecto,
                    b.montoBono,
                    b.salarioFinalProyecto,
                    b.descripcion
                FROM bonoantiguedadproyecto b
                JOIN empleado e ON b.idEmpleado = e.idEmpleado
                JOIN proyecto p ON b.idProyecto = p.idProyecto
                WHERE (@idEmpleado IS NULL OR b.idEmpleado = @idEmpleado)
                  AND (@idProyecto IS NULL OR b.idProyecto = @idProyecto)
                ORDER BY b.gestion DESC, b.idBonoAntiguedadProyecto
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/clientes/contrato/:idContrato', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('idContrato', sql.Int, req.params.idContrato)
            .query(`
                SELECT
                    pc.idPagoCliente,
                    pc.idContrato,
                    pc.idCuota,
                    pc.fechaPago,
                    pc.monto,
                    mp.nombreMetodoPago AS metodoPago,
                    ep.nombreEstadoPago AS estadoPago
                FROM pagocliente pc
                JOIN metodopago mp ON pc.idMetodoPago = mp.idMetodoPago
                JOIN estadopago ep ON pc.idEstadoPago = ep.idEstadoPago
                WHERE pc.idContrato = @idContrato
                ORDER BY pc.fechaPago
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/clientes', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT
                pc.idPagoCliente,
                pc.idContrato,
                c.numeroContrato,
                cl.nombre AS nombreCliente,
                p.nombreProyecto,
                pc.idCuota,
                cu.numeroCuota,
                pc.fechaPago,
                pc.monto,
                mp.nombreMetodoPago AS metodoPago,
                ep.nombreEstadoPago AS estadoPago
            FROM pagocliente pc
            JOIN contrato c ON pc.idContrato = c.idContrato
            JOIN proyecto p ON c.idProyecto = p.idProyecto
            JOIN cliente cl ON p.idCliente = cl.idCliente
            LEFT JOIN cuota cu ON pc.idCuota = cu.idCuota
            JOIN metodopago mp ON pc.idMetodoPago = mp.idMetodoPago
            JOIN estadopago ep ON pc.idEstadoPago = ep.idEstadoPago
            WHERE (@desde IS NULL OR pc.fechaPago >= @desde)
              AND (@hasta IS NULL OR pc.fechaPago <= @hasta)
            ORDER BY pc.fechaPago
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/clientes/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    pc.idPagoCliente,
                    pc.idContrato,
                    pc.idCuota,
                    pc.idMetodoPago,
                    pc.idEstadoPago,
                    pc.fechaPago,
                    pc.monto,
                    c.numeroContrato + ' — ' + p.nombreProyecto + ' (' + cl.nombre + ')' AS contratoDisplay,
                    cu.numeroCuota,
                    mp.nombreMetodoPago AS metodoPago,
                    ep.nombreEstadoPago AS estadoPago
                FROM pagocliente pc
                JOIN contrato c ON pc.idContrato = c.idContrato
                JOIN proyecto p ON c.idProyecto = p.idProyecto
                JOIN cliente cl ON p.idCliente = cl.idCliente
                LEFT JOIN cuota cu ON pc.idCuota = cu.idCuota
                JOIN metodopago mp ON pc.idMetodoPago = mp.idMetodoPago
                JOIN estadopago ep ON pc.idEstadoPago = ep.idEstadoPago
                WHERE pc.idPagoCliente = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/clientes', async (req, res) => {
    const { idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago } = req.body;

    try {
        if (!idContrato || !fechaPago || !monto || !idMetodoPago || !idEstadoPago) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para registrar el pago del cliente.' });
        }

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('idContrato', sql.Int, entero(idContrato))
            .input('idCuota', sql.Int, idCuota ? entero(idCuota) : null)
            .input('fechaPago', sql.Date, fechaPago)
            .input('monto', sql.Decimal(18, 2), decimal(monto))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('idEstadoPago', sql.Int, entero(idEstadoPago))
            .query(`
                DECLARE @NuevoPagoCliente TABLE (
                    idPagoCliente INT
                );

                INSERT INTO pagocliente (
                    idContrato,
                    idCuota,
                    fechaPago,
                    monto,
                    idMetodoPago,
                    idEstadoPago
                )
                OUTPUT INSERTED.idPagoCliente INTO @NuevoPagoCliente
                VALUES (
                    @idContrato,
                    @idCuota,
                    @fechaPago,
                    @monto,
                    @idMetodoPago,
                    @idEstadoPago
                );

                SELECT idPagoCliente FROM @NuevoPagoCliente;
            `);

        res.status(201).json({ idPagoCliente: result.recordset[0].idPagoCliente });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/clientes/:id', async (req, res) => {
    const { idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('idContrato', sql.Int, entero(idContrato))
            .input('idCuota', sql.Int, idCuota ? entero(idCuota) : null)
            .input('fechaPago', sql.Date, fechaPago)
            .input('monto', sql.Decimal(18, 2), decimal(monto))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('idEstadoPago', sql.Int, entero(idEstadoPago))
            .query(`
                UPDATE pagocliente
                SET idContrato = @idContrato,
                    idCuota = @idCuota,
                    fechaPago = @fechaPago,
                    monto = @monto,
                    idMetodoPago = @idMetodoPago,
                    idEstadoPago = @idEstadoPago
                WHERE idPagoCliente = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/clientes/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DELETE FROM pagocliente
                WHERE idPagoCliente = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/proveedores', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT
                pp.idPagoProveedor,
                pp.idProveedor,
                p.nombreProveedor,
                pp.idOrdenCompra,
                oc.fechaOrden,
                pp.fechaPago,
                pp.monto,
                mp.nombreMetodoPago AS metodoPago,
                pp.factura
            FROM pagoproveedor pp
            JOIN proveedor p ON pp.idProveedor = p.idProveedor
            LEFT JOIN ordencompra oc ON pp.idOrdenCompra = oc.idOrdenCompra
            JOIN metodopago mp ON pp.idMetodoPago = mp.idMetodoPago
            WHERE (@desde IS NULL OR pp.fechaPago >= @desde)
              AND (@hasta IS NULL OR pp.fechaPago <= @hasta)
            ORDER BY pp.fechaPago
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/proveedores/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    pp.idPagoProveedor,
                    pp.idProveedor,
                    p.nombreProveedor,
                    pp.idOrdenCompra,
                    pp.idMetodoPago,
                    pp.fechaPago,
                    pp.monto,
                    mp.nombreMetodoPago AS metodoPago,
                    pp.factura
                FROM pagoproveedor pp
                JOIN proveedor p ON pp.idProveedor = p.idProveedor
                JOIN metodopago mp ON pp.idMetodoPago = mp.idMetodoPago
                WHERE pp.idPagoProveedor = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/proveedores', async (req, res) => {
    const { idProveedor, idOrdenCompra, fechaPago, monto, idMetodoPago, factura } = req.body;

    try {
        if (!idProveedor || !fechaPago || !monto || !idMetodoPago) {
            return res.status(400).json({
                error: 'Proveedor, fecha, monto y método de pago son obligatorios.'
            });
        }

        const pool = await sql.connect(config);

        let idOrdenFinal = idOrdenCompra ? entero(idOrdenCompra) : null;

        if (!idOrdenFinal) {
            const ordenDisponible = await pool.request()
                .input('idProveedor', sql.Int, entero(idProveedor))
                .input('monto', sql.Decimal(18, 2), decimal(monto))
                .query(`
                    SELECT TOP 1
                        oc.idOrdenCompra,
                        oc.montoTotal,
                        ISNULL(SUM(pp.monto), 0) AS totalPagado,
                        oc.montoTotal - ISNULL(SUM(pp.monto), 0) AS saldoDisponible
                    FROM dbo.ordencompra oc
                    LEFT JOIN dbo.pagoproveedor pp
                        ON pp.idOrdenCompra = oc.idOrdenCompra
                    JOIN dbo.estadoorden eo
                        ON oc.idEstadoOrden = eo.idEstadoOrden
                    WHERE oc.idProveedor = @idProveedor
                    GROUP BY oc.idOrdenCompra, oc.montoTotal, eo.nombreEstadoOrden
                    HAVING oc.montoTotal - ISNULL(SUM(pp.monto), 0) >= @monto
                    ORDER BY 
                        CASE 
                            WHEN LOWER(eo.nombreEstadoOrden) LIKE '%entreg%' THEN 1
                            WHEN LOWER(eo.nombreEstadoOrden) LIKE '%pend%' THEN 2
                            ELSE 3
                        END,
                        oc.idOrdenCompra ASC
                `);

            if (ordenDisponible.recordset.length === 0) {
                return res.status(400).json({
                    error: 'No existe una orden de compra de este proveedor con saldo suficiente para registrar el pago.'
                });
            }

            idOrdenFinal = ordenDisponible.recordset[0].idOrdenCompra;
        }

        const result = await pool.request()
            .input('idProveedor', sql.Int, entero(idProveedor))
            .input('idOrdenCompra', sql.Int, idOrdenFinal)
            .input('fechaPago', sql.Date, fechaPago)
            .input('monto', sql.Decimal(18, 2), decimal(monto))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('factura', sql.NVarChar(200), factura || null)
            .query(`
                DECLARE @NuevoPagoProveedor TABLE (
                    idPagoProveedor INT
                );

                INSERT INTO pagoproveedor (
                    idProveedor,
                    idOrdenCompra,
                    fechaPago,
                    monto,
                    idMetodoPago,
                    factura
                )
                OUTPUT INSERTED.idPagoProveedor INTO @NuevoPagoProveedor
                VALUES (
                    @idProveedor,
                    @idOrdenCompra,
                    @fechaPago,
                    @monto,
                    @idMetodoPago,
                    @factura
                );

                SELECT idPagoProveedor FROM @NuevoPagoProveedor;
            `);

        res.status(201).json({
            idPagoProveedor: result.recordset[0].idPagoProveedor,
            idOrdenCompra: idOrdenFinal
        });

    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/proveedores/:id', async (req, res) => {
    const { idProveedor, idOrdenCompra, fechaPago, monto, idMetodoPago, factura } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('idProveedor', sql.Int, entero(idProveedor))
            .input('idOrdenCompra', sql.Int, entero(idOrdenCompra))
            .input('fechaPago', sql.Date, fechaPago)
            .input('monto', sql.Decimal(18, 2), decimal(monto))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('factura', sql.NVarChar(200), factura || null)
            .query(`
                UPDATE pagoproveedor
                SET idProveedor = @idProveedor,
                    idOrdenCompra = @idOrdenCompra,
                    fechaPago = @fechaPago,
                    monto = @monto,
                    idMetodoPago = @idMetodoPago,
                    factura = @factura
                WHERE idPagoProveedor = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/proveedores/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DELETE FROM pagoproveedor
                WHERE idPagoProveedor = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/planilla', async (req, res) => {
    const { desde, hasta, idProyecto } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .input('idProyecto', sql.Int, idProyecto || null)
            .query(`
            SELECT
                ppp.idPagoPlanillaProyecto,
                ppp.idEmpleado,
                e.nombre + ' ' + e.apellido AS empleado,
                ppp.idProyecto,
                p.nombreProyecto AS proyecto,
                ppp.idBonoAntiguedadProyecto,
                ppp.fechaPago,
                ppp.montoPagado,
                mp.nombreMetodoPago AS metodoPago,
                ep.nombreEstadoPago AS estadoPago
            FROM pagoplanillaproyecto ppp
            JOIN empleado e ON ppp.idEmpleado = e.idEmpleado
            JOIN proyecto p ON ppp.idProyecto = p.idProyecto
            JOIN metodopago mp ON ppp.idMetodoPago = mp.idMetodoPago
            JOIN estadopago ep ON ppp.idEstadoPago = ep.idEstadoPago
            WHERE (@desde IS NULL OR ppp.fechaPago >= @desde)
              AND (@hasta IS NULL OR ppp.fechaPago <= @hasta)
              AND (@idProyecto IS NULL OR ppp.idProyecto = @idProyecto)
            ORDER BY ppp.fechaPago
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.get('/planilla/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    ppp.idPagoPlanillaProyecto,
                    ppp.idEmpleado,
                    e.nombre + ' ' + e.apellido AS empleado,
                    ppp.idProyecto,
                    p.nombreProyecto AS proyecto,
                    ppp.idBonoAntiguedadProyecto,
                    ppp.idMetodoPago,
                    ppp.idEstadoPago,
                    ppp.fechaPago,
                    ppp.montoPagado,
                    mp.nombreMetodoPago AS metodoPago,
                    ep.nombreEstadoPago AS estadoPago
                FROM pagoplanillaproyecto ppp
                JOIN empleado e ON ppp.idEmpleado = e.idEmpleado
                JOIN proyecto p ON ppp.idProyecto = p.idProyecto
                JOIN metodopago mp ON ppp.idMetodoPago = mp.idMetodoPago
                JOIN estadopago ep ON ppp.idEstadoPago = ep.idEstadoPago
                WHERE ppp.idPagoPlanillaProyecto = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.post('/planilla', async (req, res) => {
    const { idEmpleado, idProyecto, idBonoAntiguedadProyecto, fechaPago, montoPagado, idMetodoPago, idEstadoPago } = req.body;

    try {
        if (!idEmpleado || !idProyecto || !fechaPago || !montoPagado || !idMetodoPago || !idEstadoPago) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para registrar el pago de planilla.' });
        }

        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('idEmpleado', sql.Int, entero(idEmpleado))
            .input('idProyecto', sql.Int, entero(idProyecto))
            .input('idBonoAntiguedadProyecto', sql.Int, idBonoAntiguedadProyecto ? entero(idBonoAntiguedadProyecto) : null)
            .input('fechaPago', sql.Date, fechaPago)
            .input('montoPagado', sql.Decimal(18, 2), decimal(montoPagado))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('idEstadoPago', sql.Int, entero(idEstadoPago))
            .query(`
                DECLARE @NuevoPagoPlanilla TABLE (
                    idPagoPlanillaProyecto INT
                );

                INSERT INTO pagoplanillaproyecto (
                    idEmpleado,
                    idProyecto,
                    idBonoAntiguedadProyecto,
                    fechaPago,
                    montoPagado,
                    idMetodoPago,
                    idEstadoPago
                )
                OUTPUT INSERTED.idPagoPlanillaProyecto INTO @NuevoPagoPlanilla
                VALUES (
                    @idEmpleado,
                    @idProyecto,
                    @idBonoAntiguedadProyecto,
                    @fechaPago,
                    @montoPagado,
                    @idMetodoPago,
                    @idEstadoPago
                );

                SELECT idPagoPlanillaProyecto FROM @NuevoPagoPlanilla;
            `);

        res.status(201).json({ idPagoPlanillaProyecto: result.recordset[0].idPagoPlanillaProyecto });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.put('/planilla/:id', async (req, res) => {
    const { idEmpleado, idProyecto, idBonoAntiguedadProyecto, fechaPago, montoPagado, idMetodoPago, idEstadoPago } = req.body;

    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('idEmpleado', sql.Int, entero(idEmpleado))
            .input('idProyecto', sql.Int, entero(idProyecto))
            .input('idBonoAntiguedadProyecto', sql.Int, idBonoAntiguedadProyecto ? entero(idBonoAntiguedadProyecto) : null)
            .input('fechaPago', sql.Date, fechaPago)
            .input('montoPagado', sql.Decimal(18, 2), decimal(montoPagado))
            .input('idMetodoPago', sql.Int, entero(idMetodoPago))
            .input('idEstadoPago', sql.Int, entero(idEstadoPago))
            .query(`
                UPDATE pagoplanillaproyecto
                SET idEmpleado = @idEmpleado,
                    idProyecto = @idProyecto,
                    idBonoAntiguedadProyecto = @idBonoAntiguedadProyecto,
                    fechaPago = @fechaPago,
                    montoPagado = @montoPagado,
                    idMetodoPago = @idMetodoPago,
                    idEstadoPago = @idEstadoPago
                WHERE idPagoPlanillaProyecto = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

router.delete('/planilla/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                DELETE FROM pagoplanillaproyecto
                WHERE idPagoPlanillaProyecto = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

module.exports = router;