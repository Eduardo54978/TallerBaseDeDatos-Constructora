const express = require('express');
const router  = express.Router();
const { sql, config } = require('../config/db');
const { errorAmigable } = require('../config/sqlError');

// ── GET todas las cotizaciones cliente ──────────────────────────────────────
router.get('/', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const pool   = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT
                cc.idCotizacionCliente,
                cc.numeroCotizacionCliente,
                cc.fechaCotizacion,
                cc.fechaValidez,
                cc.observaciones,
                p.nombreProyecto,
                ec.nombreEstadoCotizacion,
                ISNULL((SELECT SUM(dcc.cantidad * dcc.precioUnitario) FROM dbo.detallecotizacioncliente dcc WHERE dcc.idCotizacionCliente = cc.idCotizacionCliente), 0) AS totalEstimado
            FROM dbo.cotizacioncliente cc
            JOIN dbo.proyecto          p  ON cc.idProyecto         = p.idProyecto
            JOIN dbo.estadocotizacion  ec ON cc.idEstadoCotizacion  = ec.idEstadoCotizacion
            WHERE (@desde IS NULL OR cc.fechaCotizacion >= @desde)
              AND (@hasta IS NULL OR cc.fechaCotizacion <= @hasta)
            ORDER BY cc.fechaCotizacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── GET todas las cotizaciones internas con total estimado ───────────────────
router.get('/interna', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('desde', sql.Date, desde || null)
            .input('hasta', sql.Date, hasta || null)
            .query(`
            SELECT
                ci.idCotizacionInterna,
                ci.numeroCotizacionInterna,
                ci.fechaCotizacion,
                ci.observaciones,
                p.nombreProyecto,
                ec.nombreEstadoCotizacion,
                ISNULL((SELECT SUM(dci.cantidadEstimada * dci.costoUnitarioEstimado) FROM dbo.detallecotizacioninterna dci WHERE dci.idCotizacionInterna = ci.idCotizacionInterna), 0)
                + ISNULL((SELECT SUM(dmo.cantidadPersonas * dmo.horasEstimadas * ISNULL(dmo.pagoPorHora, c.pagoPorHora)) FROM dbo.detallecotizacionmanoobra dmo JOIN dbo.cargo c ON dmo.idCargo = c.idCargo WHERE dmo.idCotizacionInterna = ci.idCotizacionInterna), 0)
                AS totalEstimado
            FROM dbo.cotizacioninterna ci
            JOIN dbo.proyecto p ON ci.idProyecto = p.idProyecto
            JOIN dbo.estadocotizacion ec ON ci.idEstadoCotizacion = ec.idEstadoCotizacion
            WHERE (@desde IS NULL OR ci.fechaCotizacion >= @desde)
              AND (@hasta IS NULL OR ci.fechaCotizacion <= @hasta)
            ORDER BY ci.fechaCotizacion DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Búsqueda de cotizaciones cliente por número, proyecto o ID
router.get('/cliente/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`
                SELECT TOP 10 cc.idCotizacionCliente,
                       cc.numeroCotizacionCliente + ' — ' + p.nombreProyecto AS display
                FROM dbo.cotizacioncliente cc
                JOIN dbo.proyecto p ON cc.idProyecto = p.idProyecto
                WHERE cc.numeroCotizacionCliente LIKE @q OR p.nombreProyecto LIKE @q OR CAST(cc.idCotizacionCliente AS NVARCHAR) LIKE @q
                ORDER BY cc.idCotizacionCliente DESC
            `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Búsqueda de cotizaciones internas por número, proyecto o ID
router.get('/interna/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('q', sql.NVarChar, `%${q}%`)
            .query(`
                SELECT TOP 10 ci.idCotizacionInterna,
                       ci.numeroCotizacionInterna + ' — ' + p.nombreProyecto AS display
                FROM dbo.cotizacioninterna ci
                JOIN dbo.proyecto p ON ci.idProyecto = p.idProyecto
                WHERE ci.numeroCotizacionInterna LIKE @q OR p.nombreProyecto LIKE @q OR CAST(ci.idCotizacionInterna AS NVARCHAR) LIKE @q
                ORDER BY ci.idCotizacionInterna DESC
            `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: err.message }); }
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
        res.status(400).json({ error: errorAmigable(err) });
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
                VALUES (@num, @fecha, @validez, @obs, @idProyecto, @idEstado);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idCotizacionCliente;
            `);
        res.status(201).json({ idCotizacionCliente: result.recordset[0].idCotizacionCliente });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
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
                VALUES (@idCot, @concepto, @descripcion, @cantidad, @precioUnitario);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idDetalleCotizacionCliente;
            `);
        res.status(201).json({ idDetalleCotizacionCliente: result.recordset[0].idDetalleCotizacionCliente });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
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
                VALUES (@num, @fecha, @obs, @idProyecto, @idEstado);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idCotizacionInterna;
            `);
        res.status(201).json({ idCotizacionInterna: result.recordset[0].idCotizacionInterna });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
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
                VALUES (@idCot, @idMat, @cantidad, @costo);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idDetalleCotizacionInterna;
            `);
        res.status(201).json({ idDetalleCotizacionInterna: result.recordset[0].idDetalleCotizacionInterna });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
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
            .query(`SELECT pagoPorHora FROM dbo.cargo WHERE idCargo = @id`);
        if (cargoExiste.recordset.length === 0)
            return res.status(400).json({ error: 'Cargo no existe' });

        // El pago por hora lo decide el usuario; el del cargo es solo una sugerencia/fallback
        const pagoUsuario = Number(pagoPorHora);
        const pago = (Number.isFinite(pagoUsuario) && pagoUsuario > 0)
            ? pagoUsuario
            : Number(cargoExiste.recordset[0].pagoPorHora);

        // totalEstimado se calcula solo para informar al usuario
        const totalEstimado = cantidadPersonas * horasEstimadas * pago;

        const result = await pool.request()
            .input('idCot',             sql.Int,            idCotizacionInterna)
            .input('idCargo',           sql.Int,            idCargo)
            .input('cantidadPersonas',  sql.Int,            cantidadPersonas)
            .input('horasEstimadas',    sql.Decimal,        horasEstimadas)
            .input('pagoPorHora',       sql.Decimal(10, 2), pago)
            .query(`
                INSERT INTO dbo.detallecotizacionmanoobra
                    (idCotizacionInterna, idCargo, cantidadPersonas, horasEstimadas, pagoPorHora)
                VALUES (@idCot, @idCargo, @cantidadPersonas, @horasEstimadas, @pagoPorHora);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idDetalleManoObra;
            `);
        res.status(201).json({ idDetalleManoObra: result.recordset[0].idDetalleManoObra, totalEstimado });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── POST generar cotización CLIENTE a partir de una INTERNA aprobada ──────────
// Hereda los totales de la interna (materiales + mano de obra) y les aplica un
// porcentaje de utilidad editable. Crea dos líneas: "Materiales" y "Mano de obra".
// Es una foto fija: copia los precios calculados al momento de generar.
router.post('/interna/:id/generar-cliente', async (req, res) => {
    const idInterna = parseInt(req.params.id);
    const { porcentaje, numeroCotizacion, fechaCotizacion, fechaValidez, observaciones } = req.body;

    const pct = Number(porcentaje);
    if (!Number.isFinite(pct) || pct < 0)
        return res.status(400).json({ error: 'El porcentaje debe ser un número mayor o igual a 0' });
    if (!numeroCotizacion || !fechaCotizacion)
        return res.status(400).json({ error: 'Número y fecha de la cotización cliente son obligatorios' });

    try {
        const pool = await sql.connect(config);

        // La interna debe existir y estar Aprobada
        const interna = await pool.request()
            .input('id', sql.Int, idInterna)
            .query(`
                SELECT ci.idProyecto, ec.nombreEstadoCotizacion AS estado
                FROM dbo.cotizacioninterna ci
                JOIN dbo.estadocotizacion ec ON ci.idEstadoCotizacion = ec.idEstadoCotizacion
                WHERE ci.idCotizacionInterna = @id
            `);
        if (interna.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización interna no encontrada' });
        if ((interna.recordset[0].estado || '').toLowerCase() !== 'aprobada')
            return res.status(400).json({ error: 'La cotización interna debe estar Aprobada para generar la cotización cliente' });

        const idProyecto = interna.recordset[0].idProyecto;

        // Número único de cotización cliente
        const dupNum = await pool.request()
            .input('num', sql.NVarChar, numeroCotizacion)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE numeroCotizacionCliente = @num`);
        if (dupNum.recordset.length > 0)
            return res.status(400).json({ error: 'El número de cotización ya existe' });

        // Totales de costo de la interna
        const tot = await pool.request()
            .input('id', sql.Int, idInterna)
            .query(`
                SELECT
                    ISNULL((SELECT SUM(dci.cantidadEstimada * dci.costoUnitarioEstimado)
                            FROM dbo.detallecotizacioninterna dci
                            WHERE dci.idCotizacionInterna = @id), 0) AS totalMateriales,
                    ISNULL((SELECT SUM(dmo.cantidadPersonas * dmo.horasEstimadas * ISNULL(dmo.pagoPorHora, c.pagoPorHora))
                            FROM dbo.detallecotizacionmanoobra dmo
                            JOIN dbo.cargo c ON dmo.idCargo = c.idCargo
                            WHERE dmo.idCotizacionInterna = @id), 0) AS totalManoObra
            `);
        const mult = 1 + pct / 100;
        const precioMat = Math.round(Number(tot.recordset[0].totalMateriales) * mult * 100) / 100;
        const precioMO  = Math.round(Number(tot.recordset[0].totalManoObra)  * mult * 100) / 100;

        if (precioMat <= 0 && precioMO <= 0)
            return res.status(400).json({ error: 'La cotización interna no tiene materiales ni mano de obra para cotizar' });

        const estado = await pool.request()
            .query(`SELECT idEstadoCotizacion FROM dbo.estadocotizacion WHERE nombreEstadoCotizacion = 'Pendiente'`);
        if (estado.recordset.length === 0)
            return res.status(500).json({ error: 'Estado Pendiente no configurado en BD' });

        // Cabecera de la cotización cliente, vinculada a la interna
        const nueva = await pool.request()
            .input('num',        sql.NVarChar,     numeroCotizacion)
            .input('fecha',      sql.Date,         fechaCotizacion)
            .input('validez',    sql.Date,         fechaValidez || null)
            .input('obs',        sql.NVarChar,     observaciones || null)
            .input('idProyecto', sql.Int,          idProyecto)
            .input('idInterna',  sql.Int,          idInterna)
            .input('pct',        sql.Decimal(6,2), pct)
            .input('idEstado',   sql.Int,          estado.recordset[0].idEstadoCotizacion)
            .query(`
                INSERT INTO dbo.cotizacioncliente
                    (numeroCotizacionCliente, fechaCotizacion, fechaValidez, observaciones,
                     idProyecto, idCotizacionInterna, porcentajeUtilidad, idEstadoCotizacion)
                VALUES (@num, @fecha, @validez, @obs, @idProyecto, @idInterna, @pct, @idEstado);
                SELECT CAST(SCOPE_IDENTITY() AS INT) AS idCotizacionCliente;
            `);
        const idCliente = nueva.recordset[0].idCotizacionCliente;

        // Dos líneas resumen (sólo las que tengan monto > 0; CHECK exige precio > 0)
        const insertarLinea = (concepto, precio) => pool.request()
            .input('idCot',    sql.Int,          idCliente)
            .input('concepto', sql.NVarChar,     concepto)
            .input('desc',     sql.NVarChar,     `Generado de cotización interna con +${pct}% de utilidad`)
            .input('cant',     sql.Decimal(12,3), 1)
            .input('precio',   sql.Decimal(12,2), precio)
            .query(`
                INSERT INTO dbo.detallecotizacioncliente
                    (idCotizacionCliente, concepto, descripcion, cantidad, precioUnitario)
                VALUES (@idCot, @concepto, @desc, @cant, @precio);
            `);
        if (precioMat > 0) await insertarLinea('Materiales', precioMat);
        if (precioMO  > 0) await insertarLinea('Mano de obra', precioMO);

        res.status(201).json({
            idCotizacionCliente: idCliente,
            totalMateriales: precioMat,
            totalManoObra:   precioMO,
            montoTotal:      Math.round((precioMat + precioMO) * 100) / 100
        });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
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
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── GET / PUT editar cotización cliente ──────────────────────────────────────
router.get('/cliente/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT cc.idCotizacionCliente, cc.numeroCotizacionCliente, cc.fechaCotizacion,
                       cc.fechaValidez, cc.observaciones, cc.idProyecto, p.nombreProyecto, cc.idEstadoCotizacion
                FROM dbo.cotizacioncliente cc
                JOIN dbo.proyecto p ON cc.idProyecto = p.idProyecto
                WHERE cc.idCotizacionCliente = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización cliente no encontrada' });
        res.json(result.recordset[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /cliente/:id/detalle — cabecera + ítems + monto total (para "Ver detalles")
router.get('/cliente/:id/detalle', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const cab = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT cc.idCotizacionCliente, cc.numeroCotizacionCliente, cc.fechaCotizacion,
                       cc.fechaValidez, cc.observaciones, cc.idProyecto, p.nombreProyecto,
                       cl.nombre AS nombreCliente, ec.nombreEstadoCotizacion AS estado,
                       cc.porcentajeUtilidad, cc.idCotizacionInterna,
                       ci.numeroCotizacionInterna AS numeroInterna
                FROM dbo.cotizacioncliente cc
                JOIN dbo.proyecto p ON cc.idProyecto = p.idProyecto
                LEFT JOIN dbo.cliente cl ON p.idCliente = cl.idCliente
                LEFT JOIN dbo.estadocotizacion ec ON cc.idEstadoCotizacion = ec.idEstadoCotizacion
                LEFT JOIN dbo.cotizacioninterna ci ON cc.idCotizacionInterna = ci.idCotizacionInterna
                WHERE cc.idCotizacionCliente = @id
            `);
        if (cab.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización cliente no encontrada' });

        const items = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT concepto, descripcion, cantidad, precioUnitario,
                       CAST(cantidad * precioUnitario AS DECIMAL(14,2)) AS subtotal
                FROM dbo.detallecotizacioncliente
                WHERE idCotizacionCliente = @id
                ORDER BY idDetalleCotizacionCliente
            `);
        const total = items.recordset.reduce((s, i) => s + Number(i.subtotal || 0), 0);
        res.json({ ...cab.recordset[0], items: items.recordset, montoTotal: Number(total.toFixed(2)) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /interna/:id/detalle — cabecera + materiales + personal (mano de obra) + totales
router.get('/interna/:id/detalle', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const cab = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT ci.idCotizacionInterna, ci.numeroCotizacionInterna, ci.fechaCotizacion,
                       ci.observaciones, ci.idProyecto, p.nombreProyecto,
                       ec.nombreEstadoCotizacion AS estado
                FROM dbo.cotizacioninterna ci
                JOIN dbo.proyecto p ON ci.idProyecto = p.idProyecto
                LEFT JOIN dbo.estadocotizacion ec ON ci.idEstadoCotizacion = ec.idEstadoCotizacion
                WHERE ci.idCotizacionInterna = @id
            `);
        if (cab.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización interna no encontrada' });

        const materiales = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT m.nombreMaterial, d.cantidadEstimada, d.costoUnitarioEstimado,
                       CAST(d.cantidadEstimada * d.costoUnitarioEstimado AS DECIMAL(14,2)) AS subtotal
                FROM dbo.detallecotizacioninterna d
                JOIN dbo.material m ON d.idMaterial = m.idMaterial
                WHERE d.idCotizacionInterna = @id
                ORDER BY d.idDetalleCotizacionInterna
            `);
        // Personal asignado a la cotización (mano de obra por cargo).
        const personal = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT c.nombreCargo, d.cantidadPersonas, d.horasEstimadas,
                       ISNULL(d.pagoPorHora, c.pagoPorHora) AS pagoPorHora,
                       CAST(d.cantidadPersonas * d.horasEstimadas * ISNULL(d.pagoPorHora, c.pagoPorHora) AS DECIMAL(14,2)) AS subtotal
                FROM dbo.detallecotizacionmanoobra d
                JOIN dbo.cargo c ON d.idCargo = c.idCargo
                WHERE d.idCotizacionInterna = @id
                ORDER BY d.idDetalleManoObra
            `);
        const totalMat = materiales.recordset.reduce((s, i) => s + Number(i.subtotal || 0), 0);
        const totalMO  = personal.recordset.reduce((s, i) => s + Number(i.subtotal || 0), 0);
        res.json({
            ...cab.recordset[0],
            materiales: materiales.recordset,
            personal: personal.recordset,
            totalMateriales: Number(totalMat.toFixed(2)),
            totalManoObra: Number(totalMO.toFixed(2)),
            montoTotal: Number((totalMat + totalMO).toFixed(2)),
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cliente/:id', async (req, res) => {
    const { numeroCotizacion, fechaCotizacion, fechaValidez, observaciones } = req.body;
    if (!numeroCotizacion || !fechaCotizacion)
        return res.status(400).json({ error: 'Número y fecha son obligatorios' });
    try {
        const pool = await sql.connect(config);
        const existe = await pool.request().input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE idCotizacionCliente = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización cliente no encontrada' });

        const dup = await pool.request()
            .input('num', sql.NVarChar, numeroCotizacion)
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE numeroCotizacionCliente = @num AND idCotizacionCliente <> @id`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ese número de cotización ya existe' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('num', sql.NVarChar, numeroCotizacion)
            .input('fecha', sql.Date, fechaCotizacion)
            .input('validez', sql.Date, fechaValidez || null)
            .input('obs', sql.NVarChar, observaciones || null)
            .query(`
                UPDATE dbo.cotizacioncliente
                SET numeroCotizacionCliente = @num, fechaCotizacion = @fecha,
                    fechaValidez = @validez, observaciones = @obs
                WHERE idCotizacionCliente = @id
            `);
        res.json({ mensaje: 'Cotización cliente actualizada correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET / PUT editar cotización interna ──────────────────────────────────────
router.get('/interna/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT ci.idCotizacionInterna, ci.numeroCotizacionInterna, ci.fechaCotizacion,
                       ci.observaciones, ci.idProyecto, p.nombreProyecto, ci.idEstadoCotizacion
                FROM dbo.cotizacioninterna ci
                JOIN dbo.proyecto p ON ci.idProyecto = p.idProyecto
                WHERE ci.idCotizacionInterna = @id
            `);
        if (result.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización interna no encontrada' });
        res.json(result.recordset[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/interna/:id', async (req, res) => {
    const { numeroCotizacion, fechaCotizacion, observaciones } = req.body;
    if (!numeroCotizacion || !fechaCotizacion)
        return res.status(400).json({ error: 'Número y fecha son obligatorios' });
    try {
        const pool = await sql.connect(config);
        const existe = await pool.request().input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización interna no encontrada' });

        const dup = await pool.request()
            .input('num', sql.NVarChar, numeroCotizacion)
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE numeroCotizacionInterna = @num AND idCotizacionInterna <> @id`);
        if (dup.recordset.length > 0)
            return res.status(400).json({ error: 'Ese número de cotización ya existe' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('num', sql.NVarChar, numeroCotizacion)
            .input('fecha', sql.Date, fechaCotizacion)
            .input('obs', sql.NVarChar, observaciones || null)
            .query(`
                UPDATE dbo.cotizacioninterna
                SET numeroCotizacionInterna = @num, fechaCotizacion = @fecha, observaciones = @obs
                WHERE idCotizacionInterna = @id
            `);
        res.json({ mensaje: 'Cotización interna actualizada correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE cotización cliente (con sus detalles) ─────────────────────────────
router.delete('/cliente/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioncliente WHERE idCotizacionCliente = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización cliente no encontrada' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.detallecotizacioncliente WHERE idCotizacionCliente = @id`);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.cotizacioncliente WHERE idCotizacionCliente = @id`);

        res.json({ mensaje: 'Cotización cliente eliminada correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

// ── DELETE cotización interna (materiales + mano de obra + cabecera) ──────────
router.delete('/interna/:id', async (req, res) => {
    try {
        const pool = await sql.connect(config);

        const existe = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`SELECT 1 FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);
        if (existe.recordset.length === 0)
            return res.status(404).json({ error: 'Cotización interna no encontrada' });

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.detallecotizacioninterna WHERE idCotizacionInterna = @id`);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.detallecotizacionmanoobra WHERE idCotizacionInterna = @id`);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`DELETE FROM dbo.cotizacioninterna WHERE idCotizacionInterna = @id`);

        res.json({ mensaje: 'Cotización interna eliminada correctamente' });
    } catch (err) {
        res.status(400).json({ error: errorAmigable(err) });
    }
});

module.exports = router;
