const express = require('express');
const router  = express.Router();
const { sql } = require('../config/db');


router.get('/metodos', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT idMetodoPago, nombreMetodoPago, descripcionMetodoPago
            FROM metodopago
            ORDER BY nombreMetodoPago
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/estados', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT idEstadoPago, nombreEstadoPago, descripcionEstadoPago
            FROM estadopago
            ORDER BY nombreEstadoPago
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ PAGOS CLIENTES ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/clientes/contrato/:idContrato', async (req, res) => {
    try {
        const pool   = await sql.connect();
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
        res.status(500).json({ error: err.message });
    }
});

router.get('/clientes', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
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
            ORDER BY pc.fechaPago
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/clientes/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
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
                WHERE pc.idPagoCliente = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/clientes', async (req, res) => {
    const { idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('idContrato',   sql.Int,           idContrato)
            .input('idCuota',      sql.Int,           idCuota)
            .input('fechaPago',    sql.Date,           fechaPago)
            .input('monto',        sql.Decimal(18, 2), monto)
            .input('idMetodoPago', sql.Int,           idMetodoPago)
            .input('idEstadoPago', sql.Int,           idEstadoPago)
            .query(`
                INSERT INTO pagocliente (idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago)
                OUTPUT INSERTED.idPagoCliente
                VALUES (@idContrato, @idCuota, @fechaPago, @monto, @idMetodoPago, @idEstadoPago)
            `);
        res.status(201).json({ idPagoCliente: result.recordset[0].idPagoCliente });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/clientes/:id', async (req, res) => {
    const { idContrato, idCuota, fechaPago, monto, idMetodoPago, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id',           sql.Int,           req.params.id)
            .input('idContrato',   sql.Int,           idContrato)
            .input('idCuota',      sql.Int,           idCuota)
            .input('fechaPago',    sql.Date,           fechaPago)
            .input('monto',        sql.Decimal(18, 2), monto)
            .input('idMetodoPago', sql.Int,           idMetodoPago)
            .input('idEstadoPago', sql.Int,           idEstadoPago)
            .query(`
                UPDATE pagocliente
                SET idContrato   = @idContrato,
                    idCuota      = @idCuota,
                    fechaPago    = @fechaPago,
                    monto        = @monto,
                    idMetodoPago = @idMetodoPago,
                    idEstadoPago = @idEstadoPago
                WHERE idPagoCliente = @id
            `);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/clientes/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM pagocliente WHERE idPagoCliente = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ÔöÇÔöÇ PAGOS PROVEEDORES ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

router.get('/proveedores', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                pp.idPagoProveedor,
                pp.idProveedor,
                p.nombreProveedor,
                pp.fechaPago,
                pp.monto,
                mp.nombreMetodoPago AS metodoPago,
                pp.factura
            FROM pagoproveedor pp
            JOIN proveedor  p  ON pp.idProveedor  = p.idProveedor
            JOIN metodopago mp ON pp.idMetodoPago = mp.idMetodoPago
            ORDER BY pp.fechaPago
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/proveedores/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    pp.idPagoProveedor,
                    pp.idProveedor,
                    p.nombreProveedor,
                    pp.fechaPago,
                    pp.monto,
                    mp.nombreMetodoPago AS metodoPago,
                    pp.factura
                FROM pagoproveedor pp
                JOIN proveedor  p  ON pp.idProveedor  = p.idProveedor
                JOIN metodopago mp ON pp.idMetodoPago = mp.idMetodoPago
                WHERE pp.idPagoProveedor = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/proveedores', async (req, res) => {
    const { idProveedor, idOrdenCompra, fechaPago, monto, idMetodoPago, factura } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('idProveedor',   sql.Int,           idProveedor)
            .input('idOrdenCompra', sql.Int,           idOrdenCompra)
            .input('fechaPago',     sql.Date,           fechaPago)
            .input('monto',         sql.Decimal(18, 2), monto)
            .input('idMetodoPago',  sql.Int,           idMetodoPago)
            .input('factura',       sql.NVarChar(200),  factura)
            .query(`
                INSERT INTO pagoproveedor (idProveedor, fechaPago, monto, idMetodoPago, factura)
                OUTPUT INSERTED.idPagoProveedor
                VALUES (@idProveedor, @fechaPago, @monto, @idMetodoPago, @factura)
            `);
        res.status(201).json({ idPagoProveedor: result.recordset[0].idPagoProveedor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/proveedores/:id', async (req, res) => {
    const { idProveedor, idOrdenCompra, fechaPago, monto, idMetodoPago, factura } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id',            sql.Int,           req.params.id)
            .input('idProveedor',   sql.Int,           idProveedor)
            .input('idOrdenCompra', sql.Int,           idOrdenCompra)
            .input('fechaPago',     sql.Date,           fechaPago)
            .input('monto',         sql.Decimal(18, 2), monto)
            .input('idMetodoPago',  sql.Int,           idMetodoPago)
            .input('factura',       sql.NVarChar(200),  factura)
            .query(`
                UPDATE pagoproveedor
                SET idProveedor   = @idProveedor,
                    idOrdenCompra = @idOrdenCompra,
                    fechaPago     = @fechaPago,
                    monto         = @monto,
                    idMetodoPago  = @idMetodoPago,
                    factura       = @factura
                WHERE idPagoProveedor = @id
            `);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/proveedores/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM pagoproveedor WHERE idPagoProveedor = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/planilla', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request().query(`
            SELECT
                ppp.idPagoPlanillaProyecto,
                ppp.idEmpleado,
                e.nombre + ' ' + e.apellido AS empleado,
                ppp.idProyecto,
                p.nombreProyecto             AS proyecto,
                ppp.idBonoAntiguedadProyecto,
                ppp.fechaPago,
                ppp.montoPagado,
                mp.nombreMetodoPago          AS metodoPago,
                ep.nombreEstadoPago          AS estadoPago
            FROM pagoplanillaproyecto ppp
            JOIN empleado   e  ON ppp.idEmpleado  = e.idEmpleado
            JOIN proyecto   p  ON ppp.idProyecto  = p.idProyecto
            JOIN metodopago mp ON ppp.idMetodoPago = mp.idMetodoPago
            JOIN estadopago ep ON ppp.idEstadoPago = ep.idEstadoPago
            ORDER BY ppp.fechaPago
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/planilla/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT
                    ppp.idPagoPlanillaProyecto,
                    ppp.idEmpleado,
                    e.nombre + ' ' + e.apellido AS empleado,
                    ppp.idProyecto,
                    p.nombreProyecto             AS proyecto,
                    ppp.idBonoAntiguedadProyecto,
                    ppp.fechaPago,
                    ppp.montoPagado,
                    mp.nombreMetodoPago          AS metodoPago,
                    ep.nombreEstadoPago          AS estadoPago
                FROM pagoplanillaproyecto ppp
                JOIN empleado   e  ON ppp.idEmpleado  = e.idEmpleado
                JOIN proyecto   p  ON ppp.idProyecto  = p.idProyecto
                JOIN metodopago mp ON ppp.idMetodoPago = mp.idMetodoPago
                JOIN estadopago ep ON ppp.idEstadoPago = ep.idEstadoPago
                WHERE ppp.idPagoPlanillaProyecto = @id
            `);
        if (result.recordset.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/planilla', async (req, res) => {
    const { idEmpleado, idProyecto, idBonoAntiguedadProyecto, fechaPago, montoPagado, idMetodoPago, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('idEmpleado',               sql.Int,           idEmpleado)
            .input('idProyecto',               sql.Int,           idProyecto)
            .input('idBonoAntiguedadProyecto', sql.Int,           idBonoAntiguedadProyecto)
            .input('fechaPago',                sql.Date,           fechaPago)
            .input('montoPagado',              sql.Decimal(18, 2), montoPagado)
            .input('idMetodoPago',             sql.Int,           idMetodoPago)
            .input('idEstadoPago',             sql.Int,           idEstadoPago)
            .query(`
                INSERT INTO pagoplanillaproyecto
                    (idEmpleado, idProyecto, idBonoAntiguedadProyecto, fechaPago, montoPagado, idMetodoPago, idEstadoPago)
                OUTPUT INSERTED.idPagoPlanillaProyecto
                VALUES (@idEmpleado, @idProyecto, @idBonoAntiguedadProyecto, @fechaPago, @montoPagado, @idMetodoPago, @idEstadoPago)
            `);
        res.status(201).json({ idPagoPlanillaProyecto: result.recordset[0].idPagoPlanillaProyecto });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/planilla/:id', async (req, res) => {
    const { idEmpleado, idProyecto, idBonoAntiguedadProyecto, fechaPago, montoPagado, idMetodoPago, idEstadoPago } = req.body;
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id',                       sql.Int,           req.params.id)
            .input('idEmpleado',               sql.Int,           idEmpleado)
            .input('idProyecto',               sql.Int,           idProyecto)
            .input('idBonoAntiguedadProyecto', sql.Int,           idBonoAntiguedadProyecto)
            .input('fechaPago',                sql.Date,           fechaPago)
            .input('montoPagado',              sql.Decimal(18, 2), montoPagado)
            .input('idMetodoPago',             sql.Int,           idMetodoPago)
            .input('idEstadoPago',             sql.Int,           idEstadoPago)
            .query(`
                UPDATE pagoplanillaproyecto
                SET idEmpleado               = @idEmpleado,
                    idProyecto               = @idProyecto,
                    idBonoAntiguedadProyecto = @idBonoAntiguedadProyecto,
                    fechaPago                = @fechaPago,
                    montoPagado              = @montoPagado,
                    idMetodoPago             = @idMetodoPago,
                    idEstadoPago             = @idEstadoPago
                WHERE idPagoPlanillaProyecto = @id
            `);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/planilla/:id', async (req, res) => {
    try {
        const pool   = await sql.connect();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM pagoplanillaproyecto WHERE idPagoPlanillaProyecto = @id`);
        if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Pago no encontrado' });
        res.json({ mensaje: 'Pago eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
