const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');

// â”€â”€ GET todas las cotizaciones cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', async (req, res) => {
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT
                cc.idCotizacionCliente,
                cc.numeroCotizacionCliente,
                cc.fechaCotizacion,
                cc.fechaValidez,
                cc.observaciones,
                p.nombreProyecto,
                ec.nombreEstadoCotizacion
            FROM dbo.cotizacioncliente cc
            JOIN dbo.proyecto          p  ON cc.idProyecto         = p.idProyecto
            JOIN dbo.estadocotizacion  ec ON cc.idEstadoCotizacion  = ec.idEstadoCotizacion
            ORDER BY cc.fechaCotizacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ GET cotizaciones por proyecto (cliente + internas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/proyecto/:idProyecto', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const clientes = await pool.request()
            .input('id', sql.Int, req.params.idProyecto)
            .query(`
                SELECT
                    cc.idCotizacionCliente,
                    cc.numeroCotizacionCliente,
                    cc.fechaCotizacion,
                    cc.fechaValidez,
                    cc.observaciones,
                    ec.nombreEstadoCotizacion,
                    'cliente' AS tipo
                FROM dbo.cotizacioncliente cc
                JOIN dbo.estadocotizacion ec ON cc.idEstadoCotizacion = ec.idEstadoCotizacion
                WHERE cc.idProyecto = @id
            `);

        const internas = await pool.request()
            .input('id', sql.Int, req.params.idProyecto)
            .query(`
                SELECT
                    ci.idCotizacionInterna,
                    ci.numeroCotizacionInterna,
                    ci.fechaCotizacion,
                    ci.observaciones,
                    ec.nombreEstadoCotizacion,
                    'interna' AS tipo
                FROM dbo.cotizacioninterna ci
                JOIN dbo.estadocotizacion ec ON ci.idEstadoCotizacion = ec.idEstadoCotizacion
                WHERE ci.idProyecto = @id
            `);

        res.json({
            cotizacionesCliente:  clientes.recordset,
            cotizacionesInternas: internas.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST crear cotizaciÃ³n cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/cliente', async (req, res) => {
    const { idProyecto, numeroCotizacion, fechaCotizacion, fechaValidez, observaciones } = req.body;
    try {
        const pool = await sql.connect(config);

        // Validar que el proyecto existe
        const proyExiste = await pool.request()
            .input('id', sql.Int, idProyecto)
            .query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Proyecto no existe' });

        // Validar nÃºmero de cotizaciÃ³n Ãºnico
        const dupNum = await pool.request()
            .input('num', sql.NVarChar, numeroCotizacion)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE numeroCotizacionCliente = @num`);
        if (dupNum.recordset.length > 0)
            return res.status(400).json({ error: 'El nÃºmero de cotizaciÃ³n ya existe' });

        // Obtener estado "Pendiente"
        const estado = await pool.request()
            .query(`SELECT idEstadoCotizacion FROM dbo.estadocotizacion WHERE nombreEstadoCotizacion = 'Pendiente'`);
        if (estado.recordset.length === 0)
            return res.status(500).json({ error: 'Estado Pendiente no configurado en BD' });

        const result = await pool.request()
            .input('num',         sql.NVarChar, numeroCotizacion)
            .input('fecha',       sql.Date,     fechaCotizacion)
            .input('validez',     sql.Date,     fechaValidez     || null)
            .input('obs',         sql.NVarChar, observaciones    || null)
            .input('idProyecto',  sql.Int,      idProyecto)
            .input('idEstado',    sql.Int,      estado.recordset[0].idEstadoCotizacion)
            .query(`
                INSERT INTO dbo.cotizacioncliente
                    (numeroCotizacionCliente, fechaCotizacion, fechaValidez, observaciones, idProyecto, idEstadoCotizacion)
                OUTPUT INSERTED.idCotizacionCliente
                VALUES (@num, @fecha, @validez, @obs, @idProyecto, @idEstado)
            `);
        res.status(201).json({ idCotizacionCliente: result.recordset[0].idCotizacionCliente });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST agregar detalle a cotizaciÃ³n cliente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/cliente/:id/detalle', async (req, res) => {
    const { concepto, descripcion, cantidad, precioUnitario } = req.body;
    const idCotizacionCliente = req.params.id;

    if (cantidad <= 0 || precioUnitario <= 0)
        return res.status(400).json({ error: 'cantidad y precioUnitario deben ser mayores a 0' });

    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, idCotizacionCliente)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE idCotizacionCliente = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'CotizaciÃ³n cliente no encontrada' });

        const result = await pool.request()
            .input('idCot',          sql.Int,      idCotizacionCliente)
            .input('concepto',       sql.NVarChar, concepto)
            .input('descripcion',    sql.NVarChar, descripcion    || null)
            .input('cantidad',       sql.Decimal,  cantidad)
            .input('precioUnitario', sql.Decimal,  precioUnitario)
            .query(`
                INSERT INTO dbo.detallecotizacioncliente
                    (idCotizacionCliente, concepto, descripcion, cantidad, precioUnitario)
                OUTPUT INSERTED.idDetalleCotizacionCliente
                VALUES (@idCot, @concepto, @descripcion, @cantidad, @precioUnitario)
            `);
        res.status(201).json({ idDetalleCotizacionCliente: result.recordset[0].idDetalleCotizacionCliente });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST crear cotizaciÃ³n interna â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/interna', async (req, res) => {
    const { idProyecto, numeroCotizacion, fechaCotizacion, observaciones } = req.body;
    try {
        const pool = await sql.connect(config);

        const proyExiste = await pool.request()
            .input('id', sql.Int, idProyecto)
            .query(`SELECT 1 FROM dbo.proyecto WHERE idProyecto = @id`);
        if (proyExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Proyecto no existe' });

        const dupNum = await pool.request()
            .input('num', sql.NVarChar, numeroCotizacion)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE numeroCotizacionInterna = @num`);
        if (dupNum.recordset.length > 0)
            return res.status(400).json({ error: 'El nÃºmero de cotizaciÃ³n interna ya existe' });

        const estado = await pool.request()
            .query(`SELECT idEstadoCotizacion FROM dbo.estadocotizacion WHERE nombreEstadoCotizacion = 'Pendiente'`);
        if (estado.recordset.length === 0)
            return res.status(500).json({ error: 'Estado Pendiente no configurado en BD' });

        const result = await pool.request()
            .input('num',        sql.NVarChar, numeroCotizacion)
            .input('fecha',      sql.Date,     fechaCotizacion)
            .input('obs',        sql.NVarChar, observaciones || null)
            .input('idProyecto', sql.Int,      idProyecto)
            .input('idEstado',   sql.Int,      estado.recordset[0].idEstadoCotizacion)
            .query(`
                INSERT INTO dbo.cotizacioninterna
                    (numeroCotizacionInterna, fechaCotizacion, observaciones, idProyecto, idEstadoCotizacion)
                OUTPUT INSERTED.idCotizacionInterna
                VALUES (@num, @fecha, @obs, @idProyecto, @idEstado)
            `);
        res.status(201).json({ idCotizacionInterna: result.recordset[0].idCotizacionInterna });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST agregar detalle de materiales a cotizaciÃ³n interna â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/interna/:id/materiales', async (req, res) => {
    const { idMaterial, cantidadEstimada, costoUnitarioEstimado } = req.body;
    const idCotizacionInterna = req.params.id;

    if (cantidadEstimada <= 0 || costoUnitarioEstimado <= 0)
        return res.status(400).json({ error: 'cantidad y costo deben ser mayores a 0' });

    try {
        const pool = await sql.connect(config);

        const cotExiste = await pool.request()
            .input('id', sql.Int, idCotizacionInterna)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);
        if (cotExiste.recordset.length === 0)
            return res.status(404).json({ error: 'CotizaciÃ³n interna no encontrada' });

        const matExiste = await pool.request()
            .input('id', sql.Int, idMaterial)
            .query(`SELECT 1 FROM dbo.material WHERE idMaterial = @id`);
        if (matExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Material no existe' });

        const result = await pool.request()
            .input('idCot',      sql.Int,     idCotizacionInterna)
            .input('idMat',      sql.Int,     idMaterial)
            .input('cantidad',   sql.Decimal, cantidadEstimada)
            .input('costo',      sql.Decimal, costoUnitarioEstimado)
            .query(`
                INSERT INTO dbo.detallecotizacioninterna
                    (idCotizacionInterna, idMaterial, cantidadEstimada, costoUnitarioEstimado)
                OUTPUT INSERTED.idDetalleCotizacionInterna
                VALUES (@idCot, @idMat, @cantidad, @costo)
            `);
        res.status(201).json({ idDetalleCotizacionInterna: result.recordset[0].idDetalleCotizacionInterna });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ POST agregar detalle de mano de obra a cotizaciÃ³n interna â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/interna/:id/manodeobra', async (req, res) => {
    const { idCargo, cantidadPersonas, horasEstimadas, pagoPorHora } = req.body;
    const idCotizacionInterna = req.params.id;

    try {
        const pool = await sql.connect(config);

        const cotExiste = await pool.request()
            .input('id', sql.Int, idCotizacionInterna)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);
        if (cotExiste.recordset.length === 0)
            return res.status(404).json({ error: 'CotizaciÃ³n interna no encontrada' });

        const cargoExiste = await pool.request()
            .input('id', sql.Int, idCargo)
            .query(`SELECT 1 FROM dbo.cargo WHERE idCargo = @id`);
        if (cargoExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Cargo no existe' });

        const totalEstimado = cantidadPersonas * horasEstimadas * pagoPorHora;

        const result = await pool.request()
            .input('idCot',             sql.Int,     idCotizacionInterna)
            .input('idCargo',           sql.Int,     idCargo)
            .input('cantidadPersonas',  sql.Int,     cantidadPersonas)
            .input('horasEstimadas',    sql.Decimal, horasEstimadas)
            .input('pagoPorHora',       sql.Decimal, pagoPorHora)
            .input('totalEstimado',     sql.Decimal, totalEstimado)
            .query(`
                INSERT INTO dbo.detallecotizacionmanodeobra
                    (idCotizacionInterna, idCargo, cantidadPersonas, horasEstimadas, pagoPorHora, totalEstimado)
                OUTPUT INSERTED.idDetalleManoObra
                VALUES (@idCot, @idCargo, @cantidadPersonas, @horasEstimadas, @pagoPorHora, @totalEstimado)
            `);
        res.status(201).json({ idDetalleManoObra: result.recordset[0].idDetalleManoObra, totalEstimado });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// â”€â”€ PUT actualizar estado de cotizaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.put('/estado', async (req, res) => {
    const { idCotizacion, tipo, nuevoEstado } = req.body;
    // tipo: 'cliente' | 'interna'
    try {
        const pool = await sql.connect(config);

        const estadoRow = await pool.request()
            .input('nombre', sql.NVarChar, nuevoEstado)
            .query(`SELECT idEstadoCotizacion FROM dbo.estadocotizacion WHERE nombreEstadoCotizacion = @nombre`);
        if (estadoRow.recordset.length === 0)
            return res.status(400).json({ error: 'Estado de cotizaciÃ³n no vÃ¡lido' });

        const idEstado = estadoRow.recordset[0].idEstadoCotizacion;

        if (tipo === 'cliente') {
            const existe = await pool.request()
                .input('id', sql.Int, idCotizacion)
                .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE idCotizacionCliente = @id`);
            if (existe.recordset.length === 0)
                return res.status(404).json({ error: 'CotizaciÃ³n cliente no encontrada' });

            await pool.request()
                .input('id',       sql.Int, idCotizacion)
                .input('idEstado', sql.Int, idEstado)
                .query(`UPDATE dbo.cotizacioncliente SET idEstadoCotizacion = @idEstado WHERE idCotizacionCliente = @id`);

        } else if (tipo === 'interna') {
            const existe = await pool.request()
                .input('id', sql.Int, idCotizacion)
                .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);
            if (existe.recordset.length === 0)
                return res.status(404).json({ error: 'CotizaciÃ³n interna no encontrada' });

            await pool.request()
                .input('id',       sql.Int, idCotizacion)
                .input('idEstado', sql.Int, idEstado)
                .query(`UPDATE dbo.cotizacioninterna SET idEstadoCotizacion = @idEstado WHERE idCotizacionInterna = @id`);
        } else {
            return res.status(400).json({ error: 'tipo debe ser "cliente" o "interna"' });
        }

        res.json({ mensaje: 'Estado actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
